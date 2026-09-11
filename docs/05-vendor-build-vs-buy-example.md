# Vendor Build-vs-Buy Example — Notification Dispatch

A worked example of how a build-vs-buy decision would actually be reasoned through for one component of this architecture: `notification-dispatcher`'s multi-channel guest messaging.

## The question

Should `notification-dispatcher` implement its own SMS/email/app-push sending logic, or integrate a vendor CPaaS (Communications Platform as a Service) product (e.g. Twilio, Braze, or an airline-specific guest-messaging platform)?

## Build

**Pros**
- Full control over message templating, retry/backoff behavior, and delivery-receipt data model.
- No per-message vendor cost at scale.
- No vendor lock-in for a capability that's arguably core to guest experience.

**Cons**
- SMS/email deliverability (carrier filtering, sender reputation, international routing) is a deep, unglamorous specialty — reinventing it is a multi-quarter effort with ongoing maintenance cost.
- Compliance surface (opt-out handling, TCPA/CAN-SPAM-style regulations across jurisdictions) is significant and vendor products typically have this solved.

## Buy

**Pros**
- Deliverability, compliance, and channel-specific quirks (RCS vs SMS fallback, email bounce handling) are the vendor's problem, not ours.
- Faster time-to-value; `notification-dispatcher` becomes a thin adapter (consistent with the protocol-adapter pattern in [ADR 0004](03-adr/0004-legacy-protocol-adapter-pattern.md)) calling a vendor API instead of implementing channel logic.

**Cons**
- Per-message cost at airline scale (potentially millions of guest notifications/month during high-disruption periods) is real and needs to be modeled against build cost.
- Vendor outage becomes a dependency for guest notification — needs a fallback path (e.g. degrade to app in-app notification if SMS vendor is down).

## Recommendation

**Buy** for the channel-sending layer (SMS/email/push delivery), **build** the orchestration layer (`notification-dispatcher` itself: what to send, to whom, on which channels, with what retry policy). This mirrors the adapter pattern used elsewhere in this architecture — `notification-dispatcher` owns the domain logic and calls out to a vendor SDK/API for the actual channel mechanics, the same way a legacy protocol adapter owns translation and calls out to the event bus. The build/buy line is drawn at "does this require airline-domain knowledge to get right" (build) vs. "is this a solved problem elsewhere that we'd be reinventing" (buy).

## How this generalizes

The same framework applies to other build-vs-buy calls in this architecture (e.g. embedding/vector store for `ai-assistant`, or the event backbone itself — Kafka/Redpanda self-hosted vs. Azure Event Hub managed). The consistent question: does the component encode domain-specific logic that is this project's actual value-add, or is it infrastructure/utility that a vendor has already solved well.
