# Web — Angular OCC Dashboard & Guest Notification Viewer

```bash
npm install
npm start   # ng serve, http://localhost:4200
```

## Structure

- `src/app/ops-dashboard/` — near-real-time view of the ODS (`flight_disruption_current`), the operations-facing side of the demo.
- `src/app/guest-notifications/` — simulated guest-facing view of `guest.itinerary-reaccommodated.v1` events.
- `src/app/shared/` — shared models (mirroring the JSON schemas in `schemas/`) and `MockFeedService`.

## Why mock data instead of a live API

This reference implementation focuses its "live" demo on the event-driven `services/*` pipeline (see the repo root README's "Running it locally" and the solution intent's "what to show live vs. what to leave as docs"). `MockFeedService` stands in for a small read API/WebSocket layer that would sit in front of the ODS and the guest-translation-layer output in a production build — wiring that up is listed under "what I'd do differently" in the root README.
