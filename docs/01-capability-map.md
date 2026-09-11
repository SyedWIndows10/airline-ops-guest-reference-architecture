# Capability Map — Airline Operations & Guest Domains

This map frames the business capabilities this reference architecture touches, and draws the seam between **Operations** (flight-centric, safety/regulatory-driven) and **Guest** (passenger-centric, experience-driven) — the seam that IROPS (Irregular Operations) events cross every time a disruption happens.

## Operations domain capabilities

| Capability | Description | System of record (typical) |
|---|---|---|
| Flight Watch | Detect and classify disruptions (delay, cancellation, diversion, mechanical) | OCC (Operations Control Center) systems |
| Crew Legality | Evaluate crew duty/rest rules (FTL — Flight Time Limitations) against a disruption | Crew management system |
| Engineering / MEL | Track technical defects and Minimum Equipment List impacts | Maintenance system |
| Schedule Recovery | Re-sequence aircraft, crew, and gates after a disruption | Ops scheduling system |

## Guest domain capabilities

| Capability | Description | System of record (typical) |
|---|---|---|
| Itinerary Management | Track a guest's booked journey and its current state | PSS / reservation system |
| Reaccommodation | Generate and offer rebooking options to affected guests | Reaccommodation engine |
| Guest Notification | Communicate disruption + rebooking status across channels | Notification/CRM platform |
| Compensation & Care | Determine entitlements (meal vouchers, EU261-style compensation, hotel) | Guest services platform |

## Where this project draws the line

This reference architecture does **not** attempt to model full PSS, crew, or maintenance systems. It models the **event contract and fan-out pattern** that sits between Operations and Guest when a disruption occurs — see [02-solution-intent-irops.md](02-solution-intent-irops.md) for scope boundaries, and [03-adr/0002-guest-domain-never-subscribes-to-raw-ops-events.md](03-adr/0002-guest-domain-never-subscribes-to-raw-ops-events.md) for why Guest never reads Ops events directly.

## Capability-to-component mapping in this repo

| Capability | Repo component |
|---|---|
| Flight Watch (simulated) | `services/ops-event-publisher` |
| Crew Legality (stubbed) | `services/crew-impact-evaluator` |
| Engineering / MEL (stubbed) | `services/engineering-defect-linker` |
| Reaccommodation | `services/reaccommodation-engine` |
| Guest Notification | `services/guest-translation-layer` + `services/notification-dispatcher` |
| Ops analytics / lakehouse | `etl/` |
| Ops dashboard | `web/src/app/ops-dashboard` |
| Guest-facing view | `web/src/app/guest-notifications` |
| SOP / manual lookup | `ai-assistant/` |
