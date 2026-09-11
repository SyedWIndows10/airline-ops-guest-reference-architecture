# ADR 0002: The Guest domain never subscribes to raw Operations events

## Status
Accepted

## Context
`flight.disrupted.v1` carries operational detail (aircraft tail number, MEL codes, crew duty state, ATC/weather codes) that is either meaningless or inappropriate to expose to guest-facing systems. It's tempting to let `guest-notifications` or `reaccommodation-engine` subscribe directly to the Ops topic to "save a hop."

## Decision
A dedicated `guest-translation-layer` service subscribes to Ops events and publishes new, guest-shaped events (`guest.itinerary-reaccommodated.v1`, etc.) on a separate topic. No guest-facing service subscribes to an Ops-domain topic directly.

## Options considered

**A — Guest services subscribe directly to Ops topics and filter/project client-side (rejected)**
- Every guest consumer re-implements the same Ops→Guest field mapping, and re-implements it slightly differently over time.
- A field change in the Ops event schema (e.g. OCC adds a new disruption-reason code) silently changes guest-facing behavior with no explicit review step.
- Operational detail not meant for guests (crew names, tail numbers, technical fault codes) becomes reachable from guest-facing infrastructure — a data-minimization and security concern, not just a style preference.

**B — Guest-translation-layer as the single Ops→Guest boundary (accepted)**
- One place owns the mapping and the guest-event contract; the mapping is reviewable and versioned like any other schema change.
- Guest-facing infrastructure has no network or topic-level path to raw Ops data — enforceable at the infra layer (separate topics/ACLs), not just by convention.
- Adds one hop of latency, which is acceptable — guest notification is not a hard-real-time path.

## Consequences
- `guest-translation-layer` is the single point of change whenever guest-facing messaging needs new information — a deliberate chokepoint, not an accident (see build order note in the top-level README calling this out as the project's strongest differentiator).
- Requires its own schema (`guest.itinerary-reaccommodated.v1`) versioned independently from the Ops event schemas.
