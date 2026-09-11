# Local Dev Infra

```bash
docker-compose -f infra/docker-compose.yml up -d
```

Brings up:
- **Redpanda** (`localhost:9092`) — Kafka-API-compatible event backbone. Every `services/*` component talks to this via `kafkajs`.
- **Redpanda Console** (`localhost:8080`) — browser UI to inspect topics, consumer groups, and lag.
- **Postgres** (`localhost:5432`, db `ods`, user `airline_ops`) — the operational data store consumers upsert into; see [ADR 0003](../docs/03-adr/0003-ods-vs-lakehouse-separation.md).

Tear down with:

```bash
docker-compose -f infra/docker-compose.yml down -v
```

`-v` also drops the Postgres volume — omit it to keep ODS data between runs.

## Why Redpanda instead of Kafka + Zookeeper for local dev

Same wire protocol, one container, no JVM/Zookeeper startup cost. Production deployment target is Azure Event Hub (Kafka-protocol-compatible), so nothing here is Redpanda-specific beyond local convenience.
