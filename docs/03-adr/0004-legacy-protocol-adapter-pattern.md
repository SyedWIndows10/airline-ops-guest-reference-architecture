# ADR 0004: Legacy protocol adapter pattern for OCC/maintenance system integration

## Status
Accepted

## Context
`ops-event-publisher` and `engineering-defect-linker` stand in for integration with real OCC and maintenance systems. In practice, airline OCC and maintenance systems are frequently legacy platforms exposing SITA/Type-B messaging, flat-file exports, or proprietary XML over SOAP — not clean JSON/REST or native Kafka producers. A reference architecture that assumes every upstream system can natively publish `flight.disrupted.v1` would misrepresent the integration reality of this domain.

## Decision
Any legacy upstream system integrates through a dedicated **protocol adapter** — a small service whose only job is to translate the legacy wire format into a schema-validated event on the bus. The adapter owns the legacy-format parsing; no downstream consumer ever sees the legacy format. In this reference implementation, `ops-event-publisher` plays the role of "the adapter already having done its job" (it publishes clean `flight.disrupted.v1` events directly) — the adapter layer itself is documented here rather than built, since the point being demonstrated is the pattern, not a SITA Type-B parser.

## Options considered

**A — Let each consumer service parse the legacy format itself (rejected)**
- Every consumer needs to understand SITA/Type-B or whatever the legacy format is, duplicating fragile parsing logic.
- A legacy format change (or a second legacy source with a different format) requires touching every consumer.

**B — Single protocol adapter per legacy source, translating to the standard event schema (accepted)**
- Legacy format knowledge is isolated to one component per source system.
- Consumers only ever depend on the versioned JSON schemas in `schemas/`, regardless of how many different legacy formats feed the bus upstream.
- Adding a second legacy OCC feed (e.g. after an airline merger) means adding a second adapter, not touching existing consumers — directly analogous to why `guest-translation-layer` exists on the Guest side (ADR 0002).

## Consequences
- In a real deployment, `ops-event-publisher`'s role would be split into "legacy OCC adapter" (translates SITA/Type-B → `flight.disrupted.v1`) sitting in front of the same publish call this reference implementation already makes.
- This pattern generalizes: any new upstream integration on either the Ops or Guest side gets its own adapter/translation boundary rather than leaking a foreign format into the event bus.
