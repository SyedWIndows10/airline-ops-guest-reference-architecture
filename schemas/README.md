# Schema Registry Conventions

This directory is the source of truth for every event shape on the bus. No service should hand-roll an event payload — it should validate against the schema here before publishing, and validate on receipt before processing.

## Versioning rules

1. **Schemas are additive by default.** Adding an optional field is a non-breaking change and does not require a version bump.
2. **Any breaking change (removing a field, changing a type, changing semantics of an existing field) requires a new major version** — e.g. `flight.disrupted.v1.schema.json` → `flight.disrupted.v2.schema.json`. Both versions may coexist on the bus during a migration window.
3. **File naming:** `<event-name>.v<major>.schema.json`, where `<event-name>` matches the Kafka topic name.
4. **Every schema must declare:**
   - `$id` — a stable URI identifying the schema
   - `title` and `description`
   - `required` fields, explicitly
   - `correlationId` (string, required) — propagated across every event in a single disruption's causal chain, so a guest-facing event can be traced back to the Ops event that triggered it
5. **Consumers validate on read.** A message that fails schema validation is routed to a dead-letter topic, not silently dropped or silently coerced.
6. **Schema changes are reviewed like code** — a PR touching `schemas/` should be treated as an API contract change, because that's what it is.

## Current schemas

| Schema | Topic | Producer | Consumers |
|---|---|---|---|
| [flight.disrupted.v1.schema.json](flight.disrupted.v1.schema.json) | `flight.disrupted` | `ops-event-publisher` | `crew-impact-evaluator`, `engineering-defect-linker`, `reaccommodation-engine`, `etl` |
| [crew.legality-check.v1.schema.json](crew.legality-check.v1.schema.json) | `crew.legality-check` | `crew-impact-evaluator` | `etl` |
| [guest.itinerary-reaccommodated.v1.schema.json](guest.itinerary-reaccommodated.v1.schema.json) | `guest.itinerary-reaccommodated` | `guest-translation-layer` | `notification-dispatcher`, `web/guest-notifications` |
