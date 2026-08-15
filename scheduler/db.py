"""PostgreSQL access layer for the expiry checker.

Talks directly to the same database the NestJS backend uses, via psycopg2.
Column names mirror backend/src/compliance-records/entities/compliance-record.entity.ts.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date, datetime
from typing import Iterator, Optional

import psycopg2
import psycopg2.extras


@dataclass
class ComplianceRecord:
    id: str
    employee_id: str
    compliance_type: str
    issued_date: date
    expiry_date: date
    status: str
    expiring_notification_sent: bool
    expired_notification_sent: bool


def get_connection():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "5432")),
        dbname=os.environ.get("DB_NAME", "compliance_tracker"),
        user=os.environ.get("DB_USERNAME", "postgres"),
        password=os.environ.get("DB_PASSWORD", "postgres"),
    )


@contextmanager
def connection() -> Iterator[psycopg2.extensions.connection]:
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def fetch_manageable_records(conn) -> list[ComplianceRecord]:
    """Records that are still under automatic lifecycle management.

    Excludes soft-deleted rows and rows manually set to RENEWED — a renewed
    record is a terminal state until a human updates it again via the API,
    which resets its notification flags (see compliance-records.service.ts).
    """
    query = """
        SELECT id, employee_id, compliance_type, issued_date, expiry_date,
               status, expiring_notification_sent, expired_notification_sent
        FROM compliance_records
        WHERE deleted_at IS NULL
          AND status != 'RENEWED'
        ORDER BY expiry_date ASC
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query)
        rows = cur.fetchall()

    return [
        ComplianceRecord(
            id=str(row["id"]),
            employee_id=str(row["employee_id"]),
            compliance_type=row["compliance_type"],
            issued_date=row["issued_date"],
            expiry_date=row["expiry_date"],
            status=row["status"],
            expiring_notification_sent=row["expiring_notification_sent"],
            expired_notification_sent=row["expired_notification_sent"],
        )
        for row in rows
    ]


def update_record_status(
    conn,
    record_id: str,
    status: str,
    expiring_notification_sent: bool,
    expired_notification_sent: bool,
) -> None:
    query = """
        UPDATE compliance_records
        SET status = %s,
            expiring_notification_sent = %s,
            expired_notification_sent = %s,
            updated_at = %s
        WHERE id = %s
    """
    with conn.cursor() as cur:
        cur.execute(
            query,
            (
                status,
                expiring_notification_sent,
                expired_notification_sent,
                datetime.utcnow(),
                record_id,
            ),
        )
