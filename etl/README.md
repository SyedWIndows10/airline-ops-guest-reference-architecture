# ETL — Analytics / Lakehouse Layer

Python batch/micro-batch jobs that move event data from the bus into the ODS and the lakehouse. See [docs/03-adr/0003-ods-vs-lakehouse-separation.md](../docs/03-adr/0003-ods-vs-lakehouse-separation.md) for why these are two separate stores with two separate jobs.

## Setup

```bash
pip install -r requirements.txt
```

## Scripts

| Script | Runs | Does |
|---|---|---|
| `ingest_events_to_lakehouse.py` | continuously (micro-batch consumer) | Consumes every event topic, upserts current state into the ODS (Postgres), appends raw events to a date-partitioned Parquet log |
| `ods_to_parquet.py` | on a schedule (cron/Airflow in production) | Snapshots current ODS state to Parquet for point-in-time historical analysis |
| `data_quality_checks.py` | on a schedule, after ingestion | Runs completeness/timeliness/conformance checks against the lakehouse and ODS, flags drift between them |

## Config

Set via environment variables (defaults match `infra/docker-compose.yml`):

- `KAFKA_BROKERS` (default `localhost:9092`)
- `ODS_DSN` (default points at the local Postgres container)
- `LAKEHOUSE_ROOT` (default `etl/_lakehouse/`, gitignored)
