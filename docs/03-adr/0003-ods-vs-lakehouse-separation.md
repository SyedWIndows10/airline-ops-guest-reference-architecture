# ADR 0003: Separate an Operational Data Store (ODS) from the analytics lakehouse

## Status
Accepted

## Context
Two very different consumers need event data: the Ops dashboard (`web/ops-dashboard`) needs near-real-time, current-state queries ("what's the status of flight X right now"), while analytics/data-quality work needs historical, append-only, queryable-at-scale data ("how many disruptions had a >30 min crew-impact evaluation lag last month"). Serving both from the same store forces a compromise on either freshness or query shape.

## Decision
Two stores, two access patterns:
- **ODS (Postgres)** — current-state, upserted, indexed for point lookups. Fed directly by consumers as they process events.
- **Lakehouse (Parquet on local disk / blob storage)** — append-only, partitioned by event date, fed by a batch/micro-batch Python ETL job (`etl/ingest_events_to_lakehouse.py`) reading from the event log.

## Options considered

**A — Single Postgres database for both operational and analytical queries (rejected)**
- Analytical scans (e.g. a month of disruption events for a trend report) compete with operational point-lookups for the same resources.
- Schema evolution for analytics (adding derived columns, slowly-changing dimensions) risks destabilizing the operational schema.

**B — ODS + lakehouse separation (accepted)**
- `etl/ods_to_parquet.py` and `etl/ingest_events_to_lakehouse.py` are independent, replayable batch jobs — a bad run doesn't touch the ODS.
- Parquet partitioning by date supports the kind of scan analytics needs without an operational index strategy.
- Introduces eventual consistency between ODS and lakehouse (documented via `etl/data_quality_checks.py`'s timeliness check) — accepted as a known, monitored tradeoff rather than an unmanaged one.

## Consequences
- Two things to operate instead of one; justified because the two access patterns are genuinely different, not just "more infrastructure for its own sake."
- Data quality checks (`etl/data_quality_checks.py`) become the mechanism that catches ODS/lakehouse drift, so they are treated as a first-class deliverable, not an afterthought.
