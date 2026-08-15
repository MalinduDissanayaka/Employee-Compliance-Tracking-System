"""Publishes compliance lifecycle events to AWS EventBridge via boto3.

No AWS account IDs, ARNs, or credentials are hardcoded — the event bus name
and region come from environment variables, and boto3 resolves credentials
from the standard chain (env vars, shared config, or an instance/execution
role).
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date

import boto3

logger = logging.getLogger(__name__)

COMPLIANCE_EXPIRING_SOON = "COMPLIANCE_EXPIRING_SOON"
COMPLIANCE_EXPIRED = "COMPLIANCE_EXPIRED"

_client = None


def _eventbridge_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "events", region_name=os.environ.get("AWS_REGION", "us-east-1")
        )
    return _client


def publish_compliance_event(
    event_type: str,
    record_id: str,
    employee_id: str,
    compliance_type: str,
    status: str,
    expiry_date: date,
) -> None:
    """Publish a single compliance lifecycle event to EventBridge.

    Raises on failure so the caller can decide whether it's safe to mark the
    record as notified (see expiry_checker.py — flags are only persisted
    after a successful publish, to avoid silently dropping notifications).
    """
    payload = {
        "recordId": record_id,
        "employeeId": employee_id,
        "complianceType": compliance_type,
        "status": status,
        "expiryDate": expiry_date.isoformat(),
    }

    event_bus_name = os.environ.get("EVENT_BUS_NAME", "default")
    event_source = os.environ.get("EVENT_SOURCE", "compliance.tracker")

    response = _eventbridge_client().put_events(
        Entries=[
            {
                "Source": event_source,
                "DetailType": event_type,
                "Detail": json.dumps(payload),
                "EventBusName": event_bus_name,
            }
        ]
    )

    if response.get("FailedEntryCount", 0) > 0:
        failure = response["Entries"][0]
        raise RuntimeError(
            f"EventBridge rejected event {event_type} for record {record_id}: "
            f"{failure.get('ErrorCode')} — {failure.get('ErrorMessage')}"
        )

    logger.info("Published %s for record %s to bus %s", event_type, record_id, event_bus_name)
