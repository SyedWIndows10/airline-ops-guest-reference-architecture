# ADR 0001: Use events, not synchronous APIs, to propagate a disruption

## Status
Accepted

## Context
When a flight is disrupted, five or more independent systems (crew, engineering, reaccommodation, guest notification, analytics) need to know. The naive approach is for the OCC system to call each downstream system's API directly.

## Decision
Operations publishes a single `flight.disrupted.v1` event to a durable event backbone (Kafka/Redpanda locally, Azure Event Hub in production). Downstream systems subscribe independently. Operations has no knowledge of who consumes the event or how many consumers exist.

## Options considered

**A — Synchronous API calls from OCC to every downstream system (rejected)**
- Couples OCC to the availability and contract of every consumer.
- Adding a new consumer requires an OCC code change.
- A slow or down consumer degrades the disruption-reporting path itself.

**B — Central orchestrator service calling downstream APIs (rejected)**
- Moves the coupling problem into a new "god service" rather than removing it.
- Creates a single component that must know every consumer's contract.

**C — Event backbone with independent consumers (accepted)**
- OCC publishes once; consumers come and go without OCC changes.
- Consumers can replay/reprocess from the log for recovery or backfill.
- Trades immediate consistency for eventual consistency — acceptable here because no consumer requires a synchronous answer within the disruption-detection path itself.

## Consequences
- Requires a schema registry / contract discipline (see `schemas/README.md`) since producer and consumers are decoupled in time.
- Requires correlation IDs across events for traceability (see `services/shared`).
- Debugging a fan-out failure means tracing consumer offsets/lag, not a call stack — operational tooling (consumer lag dashboards) becomes part of the NFR story, see [04-nfr-and-security.md](../04-nfr-and-security.md).
