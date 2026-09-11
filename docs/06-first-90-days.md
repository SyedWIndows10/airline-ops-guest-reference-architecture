# First 90 Days — If This Were a Real Program

How I'd sequence turning this reference architecture into a production program, if handed the mandate.

## Days 1-30: Contracts and observability first

- Stand up a real schema registry (Confluent Schema Registry or equivalent) enforcing the versioning rules in `schemas/README.md` as a CI gate, not a convention.
- Wire up consumer lag dashboards and correlation-ID-based tracing (see [04-nfr-and-security.md](04-nfr-and-security.md#observability)) before any new consumer goes live — you cannot safely add fan-out you can't observe.
- Identify the real legacy OCC/maintenance integration points and scope the actual protocol adapters (ADR 0004) needed — SITA Type-B, proprietary XML, whatever the real upstream systems speak.
- Get data-classification sign-off on what guest fields are allowed to ever appear in an event payload, before any real guest PII touches the bus.

## Days 31-60: Replace the stubs that matter most

- `reaccommodation-engine`: replace the stub with a real (even if simplified) constraint model against actual seat/fare inventory — this is the component most likely to surface genuine architecture tradeoffs (latency vs. optimality of rebooking search).
- `notification-dispatcher`: move to an outbox pattern with a vendor CPaaS integration for actual channel delivery (see [05-vendor-build-vs-buy-example.md](05-vendor-build-vs-buy-example.md)), with delivery-receipt tracking so "did the guest actually get told" is answerable from data.
- `crew-impact-evaluator`: engage crew scheduling SMEs to validate the FTL rule stub against real regulatory requirements (FAA/EASA depending on operating region) — this is a compliance-sensitive component and should not ship on a placeholder rule set.

## Days 61-90: Guardrail hardening and scale validation

- Enforce topic-level ACLs so the Guest domain has no network path to Ops-domain topics — move ADR 0002 from "enforced by convention" to "enforced by infrastructure."
- Load-test the fan-out path against a realistic IROPS event volume (a major weather event can generate thousands of disruptions in a short window) and validate the latency targets in [04-nfr-and-security.md](04-nfr-and-security.md#latency) hold under that load.
- Expand `ai-assistant` from 3-4 mock SOP documents to the real SOP corpus, with a real embedding/completion model behind `query_api/llmClient.js`, while keeping the citation/audit-log guardrails (ADR 0005) unchanged — the guardrails were deliberately built to be model-agnostic.
- Run a tabletop exercise with actual OCC/Guest Services staff walking through a simulated disruption end-to-end, and use their feedback to revise the capability map (`01-capability-map.md`) and solution intent (`02-solution-intent-irops.md`) before committing further engineering investment.
