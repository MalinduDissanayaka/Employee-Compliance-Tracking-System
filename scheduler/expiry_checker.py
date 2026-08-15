#!/usr/bin/env python3
"""Scheduled expiry checker for the Employee Compliance Tracking System.

For every compliance record that isn't soft-deleted or manually RENEWED:
  1. Recompute status from expiry_date vs. today:
       expiry_date < today            -> EXPIRED
       expiry_date within N days      -> EXPIRING_SOON   (N = EXPIRING_SOON_THRESHOLD_DAYS, default 30)
       otherwise                      -> ACTIVE
  2. Publish exactly one EventBridge event per lifecycle transition:
       -> EXPIRING_SOON : COMPLIANCE_EXPIRING_SOON (once, guarded by expiring_notification_sent)
       -> EXPIRED       : COMPLIANCE_EXPIRED       (once, guarded by expired_notification_sent)
  3. Persist the new status and notification flags.

Idempotency: the notification flags are the source of truth for "have we
already told someone about this transition", not the status column. Running
this script any number of times against unchanged data produces zero
duplicate events, because a flag is only flipped to True after a *successful*
EventBridge publish — if publishing fails, the flag stays False and the next
run retries it.

Can be run directly (`python expiry_checker.py`), on a cron schedule, or
wrapped by an EventBridge Scheduler rule invoking it as a Lambda function via
`lambda_handler`.
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import date, timedelta

from dotenv import load_dotenv

import db
import events

logger = logging.getLogger("expiry_checker")


def compute_status(expiry_date: date, today: date, threshold_days: int) -> str:
    if expiry_date < today:
        return "EXPIRED"
    if expiry_date <= today + timedelta(days=threshold_days):
        return "EXPIRING_SOON"
    return "ACTIVE"


def process_record(conn, record: db.ComplianceRecord, today: date, threshold_days: int) -> str:
    """Process a single record. Returns an outcome label for summary logging."""
    new_status = compute_status(record.expiry_date, today, threshold_days)

    expiring_notification_sent = record.expiring_notification_sent
    expired_notification_sent = record.expired_notification_sent
    outcome = "unchanged"

    if new_status == "EXPIRING_SOON" and not expiring_notification_sent:
        try:
            events.publish_compliance_event(
                events.COMPLIANCE_EXPIRING_SOON,
                record.id,
                record.employee_id,
                record.compliance_type,
                new_status,
                record.expiry_date,
            )
            expiring_notification_sent = True
            outcome = "notified_expiring_soon"
        except Exception:
            logger.exception(
                "Failed to publish COMPLIANCE_EXPIRING_SOON for record %s; "
                "will retry on next run",
                record.id,
            )

    if new_status == "EXPIRED" and not expired_notification_sent:
        try:
            events.publish_compliance_event(
                events.COMPLIANCE_EXPIRED,
                record.id,
                record.employee_id,
                record.compliance_type,
                new_status,
                record.expiry_date,
            )
            expired_notification_sent = True
            outcome = "notified_expired"
        except Exception:
            logger.exception(
                "Failed to publish COMPLIANCE_EXPIRED for record %s; will retry on next run",
                record.id,
            )

    status_changed = new_status != record.status
    flags_changed = (
        expiring_notification_sent != record.expiring_notification_sent
        or expired_notification_sent != record.expired_notification_sent
    )

    if status_changed or flags_changed:
        db.update_record_status(
            conn,
            record.id,
            new_status,
            expiring_notification_sent,
            expired_notification_sent,
        )
        if status_changed and outcome == "unchanged":
            outcome = f"status_updated_to_{new_status.lower()}"

    return outcome


def run(today: date | None = None) -> dict:
    today = today or date.today()
    threshold_days = int(os.environ.get("EXPIRING_SOON_THRESHOLD_DAYS", "30"))

    summary = {"processed": 0, "unchanged": 0}

    with db.connection() as conn:
        records = db.fetch_manageable_records(conn)
        logger.info("Loaded %d compliance record(s) for review", len(records))

        for record in records:
            outcome = process_record(conn, record, today, threshold_days)
            conn.commit()
            summary["processed"] += 1
            summary[outcome] = summary.get(outcome, 0) + 1

    logger.info("Expiry check complete: %s", summary)
    return summary


def lambda_handler(event, context):
    """Entry point when deployed as a Lambda function invoked by an
    EventBridge Scheduler rule (e.g. rate(1 day))."""
    return run()


def main() -> int:
    load_dotenv()
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    try:
        run()
    except Exception:
        logger.exception("Expiry check failed")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
