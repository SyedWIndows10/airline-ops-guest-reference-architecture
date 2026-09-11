"""
Snapshots the current-state ODS tables (Postgres) to Parquet on a schedule
(e.g. hourly via cron/Airflow in production). This is distinct from
ingest_events_to_lakehouse.py's raw event log: this script captures
*point-in-time state* ("what did our view of every flight look like as of
09:00"), which the raw event log alone doesn't give you cheaply, since it
would need to be replayed and reduced. See
docs/03-adr/0003-ods-vs-lakehouse-separation.md.
"""
import os
from datetime import datetime, timezone

import pandas as pd
import psycopg2

from config import ODS_DSN, LAKEHOUSE_ROOT

SNAPSHOT_TABLES = ["flight_disruption_current"]


def snapshot_table(conn, table: str, snapshot_time: datetime):
    df = pd.read_sql(f"SELECT * FROM {table}", conn)
    df["snapshot_time"] = snapshot_time.isoformat()

    out_dir = os.path.join(
        LAKEHOUSE_ROOT,
        f"ods_snapshot_{table}",
        f"dt={snapshot_time.date().isoformat()}",
    )
    os.makedirs(out_dir, exist_ok=True)
    file_path = os.path.join(out_dir, f"snapshot-{snapshot_time.strftime('%H%M%S')}.parquet")
    df.to_parquet(file_path, index=False)
    print(f"[ods_to_parquet] snapshotted {len(df)} rows from {table} to {file_path}")


def main():
    conn = psycopg2.connect(ODS_DSN)
    snapshot_time = datetime.now(timezone.utc)
    for table in SNAPSHOT_TABLES:
        snapshot_table(conn, table, snapshot_time)


if __name__ == "__main__":
    main()
