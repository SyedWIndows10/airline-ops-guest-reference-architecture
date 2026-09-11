# Solution Intent — IROPS (Irregular Operations) Event Flow

## Problem statement

When a flight is disrupted (delay, cancellation, diversion, mechanical defect), the fact of that disruption needs to reach several independent consumers — crew legality, engineering, guest reaccommodation, guest notification, and analytics — each with different latency needs, different data shapes, and different authority to act. Point-to-point integration between these systems couples them tightly and makes it hard to add a new consumer (e.g. a new notification channel) without touching upstream systems.

## Solution intent

Model the disruption as a single, authoritative **event** (`flight.disrupted.v1`) published once by Operations, and fan it out to independent consumers over an event backbone (Kafka / Azure Event Hub). Each consumer subscribes only to the events it needs and publishes its own downstream events where relevant (e.g. `guest.itinerary-reaccommodated.v1`). Guest-facing systems never subscribe to raw Ops events directly — see [ADR 0002](03-adr/0002-guest-domain-never-subscribes-to-raw-ops-events.md).

## In scope

- Event contract design for a disruption and its downstream effects (schemas, versioning)
- A working fan-out: one publisher, multiple independent consumers
- A guest-domain translation layer that converts Ops-shaped events into guest-shaped events
- A minimal analytics path: events → operational data store (ODS) → lakehouse (Parquet)
- A minimal RAG-based SOP assistant with citation/guardrails, as an example of applying AI to an ops workflow safely
- Architecture decision records for the non-obvious choices

## Out of scope

- Real crew legality (FTL) rule engines — stubbed
- Real reaccommodation optimization (seat/fare inventory logic) — stubbed
- Real PSS/reservation system integration — simulated via mock data
- Production-grade auth, multi-tenancy, and full NFR implementation — documented, not built
- Full Angular UI polish — enough to demonstrate the data flow, not a production UX

## Primary flow (the vertical slice that runs live)

```
ops-event-publisher
      │  flight.disrupted.v1
      ▼
   Kafka / Redpanda
      │
      ├──► crew-impact-evaluator        (stubbed FTL check, logs impact)
      ├──► engineering-defect-linker    (stub, logs correlation)
      ├──► reaccommodation-engine       (stub, generates mock rebooking options)
      │        │ guest.itinerary-reaccommodated.v1
      │        ▼
      ├──► guest-translation-layer  ──► notification-dispatcher ──► (console/app/SMS/email, stubbed)
      │                                                                     │
      │                                                                     ▼
      │                                                          web/guest-notifications (Angular)
      │
      └──► etl (ODS → lakehouse, Python)  ──► web/ops-dashboard (Angular)
```

## Success criteria for this reference implementation

1. A single event triggers at least three independent, decoupled consumers.
2. Guest and Ops domains are demonstrably isolated (different event shapes, not just different topics).
3. The event contract is versioned and documented before any consumer code exists.
4. The analytics path shows a real (if small) ETL job, not just a diagram.
5. Every non-obvious decision has a written ADR with rejected alternatives.
