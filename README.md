# Airline Ops & Guest Reference Architecture

> A small, working reference implementation of event-driven IROPS (Irregular Operations) handling —
> one authoritative disruption event, fanned out to crew, engineering, guest, and analytics consumers.

## Why this project exists

Airline disruptions sit on a seam between two very different worlds: **Operations**, which is flight-centric, safety-driven, and thinks in tail numbers and duty rules; and **Guest**, which is passenger-centric and thinks in itineraries and promises kept. Most of the interesting architecture problems in this space are about how information crosses that seam without coupling the two domains together. This repo is a small, honest, working model of that seam — not a full airline systems suite.

## Architecture at a glance

```
ops-event-publisher → Kafka/Redpanda → crew-impact-evaluator
                                     → engineering-defect-linker
                                     → reaccommodation-engine → guest-translation-layer → notification-dispatcher → web/guest-notifications
                                     → etl (ODS + lakehouse) → web/ops-dashboard
```

See [docs/01-capability-map.md](docs/01-capability-map.md) for the full capability breakdown, [docs/02-solution-intent-irops.md](docs/02-solution-intent-irops.md) for the primary flow, and [docs/diagrams/](docs/diagrams/) for the context, container, and sequence diagrams.

## Why three languages (Angular / Node.js / Python)

| Layer | Tool | Architectural reason |
|---|---|---|
| Guest/Ops UI | **Angular** | Strong typing and structure suit a regulated, multi-team enterprise UI — matches how enterprise operational dashboards are usually built and governed |
| Event-driven services | **Node.js** | Lightweight, fast to stand up multiple independent consumers; good fit for I/O-bound fan-out rather than CPU-bound work |
| ETL / analytics pipeline | **Python** | Standard for data engineering — pandas/PyArrow for the ODS→lakehouse batch job, easy integration with embeddings for the RAG layer |
| Event backbone | Kafka (via Redpanda in Docker for local dev) or Azure Event Hub | Redpanda keeps the local dev loop simple without needing a cloud subscription |

This is a deliberate architectural split, not an accident — see the ADRs below for the reasoning behind the boundaries these languages sit on.

## What's in scope / out of scope

See [docs/02-solution-intent-irops.md](docs/02-solution-intent-irops.md) for the full breakdown. In short: the event contract, the fan-out pattern, guest/ops isolation, and a minimal analytics + AI-assistant path are in scope. Real crew/reaccommodation optimization logic, full PSS integration, and production-grade NFRs are documented but stubbed.

## Repo structure

| Path | Contents |
|---|---|
| [docs/](docs/) | Capability map, solution intent, ADRs, NFR/security notes, diagrams |
| [schemas/](schemas/) | Versioned JSON Schemas for every event on the bus |
| [services/](services/) | Node.js event-driven producers/consumers |
| [etl/](etl/) | Python batch ETL into the ODS and lakehouse |
| [web/](web/) | Angular OCC dashboard and guest notification viewer |
| [ai-assistant/](ai-assistant/) | RAG-based SOP assistant with citation/guardrails |
| [infra/](infra/) | Local dev stack (docker-compose: Redpanda, Postgres) |

## Running it locally

```bash
docker-compose -f infra/docker-compose.yml up -d
cd services/shared && npm install
cd services/ops-event-publisher && npm install && npm start
cd etl && pip install -r requirements.txt && python ingest_events_to_lakehouse.py
cd web && npm install && ng serve
```

## Key architectural decisions

- [ADR 0001 — Events, not APIs, for disruption propagation](docs/03-adr/0001-events-not-apis-for-disruption.md)
- [ADR 0002 — Guest domain never subscribes to raw Ops events](docs/03-adr/0002-guest-domain-never-subscribes-to-raw-ops-events.md)
- [ADR 0003 — ODS vs. lakehouse separation](docs/03-adr/0003-ods-vs-lakehouse-separation.md)
- [ADR 0004 — Legacy protocol adapter pattern](docs/03-adr/0004-legacy-protocol-adapter-pattern.md)
- [ADR 0005 — AI guardrails for the SOP assistant](docs/03-adr/0005-ai-guardrails-for-sop-assistant.md)

## What I'd do differently

I'd introduce the schema registry and contract tests earlier than I did — right now conformance is enforced by convention (everyone reads `schemas/`) rather than by a CI gate that fails a service's build when it drifts from its declared schema version. I'd also give `reaccommodation-engine` a real (if simplified) constraint model instead of a stub, since it's the service most likely to surface interesting architecture questions in a follow-up conversation. And I'd move the guest notification fan-out (`notification-dispatcher`) to an explicit outbox pattern rather than at-least-once delivery straight off the consumer, to make the "did the guest actually get told" question answerable from data rather than from logs.
