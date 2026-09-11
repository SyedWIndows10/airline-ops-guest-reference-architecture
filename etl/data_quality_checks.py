"""
Completeness / timeliness / conformance checks over the lakehouse and ODS.

This is what actually catches the ODS/lakehouse drift that ADR 0003 accepts
as a known tradeoff of splitting the two stores — without this script, drift
is silent until someone notices a dashboard number looks wrong.

Run after ingest_events_to_lakehouse.py / ods_to_parquet.py, e.g. as the next
step in a scheduled pipeline.
"""
import glob
import os
import sys
from datetime import datetime, timedelta, timezone

import pandas as pd
import psycopg2

from config import ODS_DSN, LAKEHOUSE_ROOT

STALENESS_THRESHOLD_MINUTES = 30


def check_completeness(topic_dir: str) -> list:
    """Every Parquet file must have the required key columns populated."""
    issues = []
    required_columns = {"eventId", "correlationId", "eventTime"}
    for file_path in glob.glob(os.path.join(LAKEHOUSE_ROOT, topic_dir, "**", "*.parquet"), recursive=True):
        df = pd.read_parquet(file_path)
        missing_cols = required_columns - set(df.columns)
        if missing_cols:
            issues.append(f"COMPLETENESS: {file_path} missing columns {missing_cols}")
            continue
        null_counts = df[list(required_columns)].isnull().sum()
        for col, count in null_counts.items():
            if count > 0:
                issues.append(f"COMPLETENESS: {file_path} has {count} null values in required column '{col}'")
    return issues


def check_timeliness(conn) -> list:
    """The most recent ODS row shouldn't be older than STALENESS_THRESHOLD_MINUTES
    while the publisher is actively running — flags a stalled consumer."""
    issues = []
    with conn.cursor() as cur:
        cur.execute("SELECT MAX(updated_at) FROM flight_disruption_current")
        row = cur.fetchone()
        last_update = row[0] if row else None

    if last_update is None:
        issues.append("TIMELINESS: flight_disruption_current has no rows yet")
        return issues

    age = datetime.now(timezone.utc) - last_update
    if age > timedelta(minutes=STALENESS_THRESHOLD_MINUTES):
        issues.append(
            f"TIMELINESS: most recent ODS update is {age} old, "
            f"exceeds {STALENESS_THRESHOLD_MINUTES}m threshold"
        )
    return issues


def check_conformance(conn) -> list:
    """The set of (flightNumber, flightDate) in the ODS should be a subset of what's
    in the flight.disrupted lakehouse partition for the same dates — a proxy for
    'the ODS and the lakehouse agree on what happened'."""
    issues = []
    ods_df = pd.read_sql("SELECT flight_number, flight_date FROM flight_disruption_current", conn)
    ods_keys = set(zip(ods_df["flight_number"], ods_df["flight_date"].astype(str)))

    lake_keys = set()
    for file_path in glob.glob(os.path.join(LAKEHOUSE_ROOT, "flight_disrupted", "**", "*.parquet"), recursive=True):
        df = pd.read_parquet(file_path, columns=["flightNumber", "flightDate"])
        lake_keys.update(zip(df["flightNumber"], df["flightDate"].astype(str)))

    missing_from_lake = ods_keys - lake_keys
    if missing_from_lake:
        issues.append(f"CONFORMANCE: {len(missing_from_lake)} ODS row(s) not found in lakehouse: {missing_from_lake}")
    return issues


def main():
    conn = psycopg2.connect(ODS_DSN)
    all_issues = (
        check_completeness("flight_disrupted")
        + check_timeliness(conn)
        + check_conformance(conn)
    )

    if all_issues:
        print(f"[data_quality_checks] {len(all_issues)} issue(s) found:")
        for issue in all_issues:
            print(f"  - {issue}")
        sys.exit(1)

    print("[data_quality_checks] all checks passed")


if __name__ == "__main__":
    main()
