"""
Consumes every event topic on the bus and does two things per message:

1. Upserts current state into the ODS (Postgres) — fast point lookups for
   web/ops-dashboard. See docs/03-adr/0003-ods-vs-lakehouse-separation.md.
2. Appends the raw event to a date-partitioned Parquet log under
   etl/_lakehouse/<topic>/dt=<flightDate>/ — the append-only analytics store.

This is a near-real-time micro-batch job, not a true streaming job: it buffers
messages for BATCH_WINDOW_SECONDS (or BATCH_SIZE, whichever comes first) before
flushing, which keeps small Parquet files from proliferating on every message.
"""
import json
import os
import time
from datetime import datetime, timezone

import pandas as pd
import psycopg2
from kafka import KafkaConsumer

from config import KAFKA_BROKERS, ODS_DSN, LAKEHOUSE_ROOT

TOPICS = ["flight.disrupted", "crew.legality-check", "guest.itinerary-reaccommodated"]
BATCH_WINDOW_SECONDS = 15
BATCH_SIZE = 50


def ensure_ods_tables(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS flight_disruption_current (
                flight_number TEXT NOT NULL,
                flight_date DATE NOT NULL,
                disruption_type TEXT NOT NULL,
                disruption_reason_code TEXT,
                estimated_delay_minutes INTEGER,
                affected_passenger_count INTEGER,
                correlation_id UUID NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL,
                PRIMARY KEY (flight_number, flight_date)
            )
            """
        )
    conn.commit()


def upsert_disruption(conn, event: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO flight_disruption_current
                (flight_number, flight_date, disruption_type, disruption_reason_code,
                 estimated_delay_minutes, affected_passenger_count, correlation_id, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (flight_number, flight_date) DO UPDATE SET
                disruption_type = EXCLUDED.disruption_type,
                disruption_reason_code = EXCLUDED.disruption_reason_code,
                estimated_delay_minutes = EXCLUDED.estimated_delay_minutes,
                affected_passenger_count = EXCLUDED.affected_passenger_count,
                correlation_id = EXCLUDED.correlation_id,
                updated_at = EXCLUDED.updated_at
            """,
            (
                event["flightNumber"],
                event["flightDate"],
                event["disruptionType"],
                event.get("disruptionReasonCode"),
                event.get("estimatedDelayMinutes"),
                event.get("affectedPassengerCount"),
                event["correlationId"],
                datetime.now(timezone.utc),
            ),
        )
    conn.commit()


def flush_to_parquet(topic: str, events: list):
    if not events:
        return
    df = pd.DataFrame(events)
    # Partition by the event's own date field where available, else ingestion date.
    partition_date = None
    for candidate in ("flightDate", "originalFlightDate"):
        if candidate in df.columns:
            partition_date = df[candidate].iloc[0]
            break
    partition_date = partition_date or datetime.now(timezone.utc).date().isoformat()

    out_dir = os.path.join(LAKEHOUSE_ROOT, topic.replace(".", "_"), f"dt={partition_date}")
    os.makedirs(out_dir, exist_ok=True)
    file_path = os.path.join(out_dir, f"batch-{int(time.time() * 1000)}.parquet")
    df.to_parquet(file_path, index=False)
    print(f"[ingest_events_to_lakehouse] wrote {len(events)} events to {file_path}")


def main():
    conn = psycopg2.connect(ODS_DSN)
    ensure_ods_tables(conn)

    consumer = KafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BROKERS,
        group_id="etl-lakehouse-ingest",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
        consumer_timeout_ms=BATCH_WINDOW_SECONDS * 1000,
    )

    print(f"[ingest_events_to_lakehouse] subscribed to {TOPICS}, flushing every {BATCH_WINDOW_SECONDS}s or {BATCH_SIZE} events")

    buffers = {topic: [] for topic in TOPICS}
    while True:
        for message in consumer:
            buffers[message.topic].append(message.value)
            if message.topic == "flight.disrupted":
                upsert_disruption(conn, message.value)
            if len(buffers[message.topic]) >= BATCH_SIZE:
                flush_to_parquet(message.topic, buffers[message.topic])
                buffers[message.topic] = []

        # consumer_timeout_ms elapsed with no messages: flush whatever's buffered.
        for topic, events in buffers.items():
            flush_to_parquet(topic, events)
        buffers = {topic: [] for topic in TOPICS}


if __name__ == "__main__":
    main()
