# Non-Functional Requirements & Security

This reference implementation demonstrates the pattern; it does not implement every NFR to production standard. This document states what a production build would need and where this repo stands relative to it.

## Availability & reliability

| Requirement | Production target | This repo |
|---|---|---|
| Event backbone durability | Multi-broker replication, min-in-sync-replicas ≥ 2 | Single-node Redpanda (local dev only) |
| Consumer failure isolation | A down consumer never blocks the publisher or other consumers | Demonstrated — publisher has no knowledge of consumers (ADR 0001) |
| Dead-letter handling | Poison messages routed to `<topic>.dead-letter`, alerted on, replayable | Implemented in `services/shared/eventClient.js` |
| Guest notification delivery guarantee | Outbox pattern with delivery-receipt tracking | Not implemented — see README "what I'd do differently" |

## Latency

| Path | Target | Notes |
|---|---|---|
| Disruption detected → crew legality check | < 30s | Achievable with this architecture; not load-tested here |
| Disruption detected → guest notified | < 15 min (per SOP 4.1.3, see `ai-assistant/mock_sops/`) | Event-driven fan-out comfortably meets this; the bottleneck in practice is upstream disruption *detection*, not this pipeline |

## Security

| Concern | Approach |
|---|---|
| Guest data minimization | Enforced structurally — `guest-translation-layer` is the only path from Ops to Guest domain, and its schema (`guest.itinerary-reaccommodated.v1`) has no Ops-domain fields (ADR 0002) |
| Topic-level access control | Production deployment should enforce ACLs so guest-facing services have no network/topic access to Ops-domain topics at all — not just "don't subscribe," but "cannot subscribe" |
| Schema validation as a security boundary | Every consumer validates against `schemas/` before processing — malformed or unexpected payloads are dead-lettered, not processed (ADR 0001, `services/shared/schemaValidator.js`) |
| AI assistant grounding | Mandatory citation + audit log prevent the SOP assistant from being a source of ungrounded operational guidance (ADR 0005) |
| Secrets | None in this repo — local dev credentials in `infra/docker-compose.yml` are dev-only defaults, never used outside local Docker |
| PII in event payloads | `guestId` in this reference implementation is a mock identifier, not a real PII field; a production schema would need explicit data-classification review before adding any real guest PII to an event payload |

## Observability

Not built in this reference implementation, but required for production:
- Consumer lag dashboards per consumer group (Redpanda Console, included in `infra/docker-compose.yml`, gives a local preview of this)
- Correlation-ID-based distributed tracing across the full fan-out (every event already carries `correlationId` — see `schemas/README.md` — which is what a tracing implementation would key on)
- Data quality check results (`etl/data_quality_checks.py`) wired into an alerting channel rather than exit-code-only

## Compliance considerations (documented, not implemented)

- EU261-style compensation calculation is explicitly out of scope (see [ADR — cancellation handling SOP](../ai-assistant/mock_sops/irops-cancellation-handling.md))
- Data residency/retention requirements for guest PII would need to be scoped before this pattern is used with real guest data
