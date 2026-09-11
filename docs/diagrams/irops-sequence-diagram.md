# IROPS Sequence Diagram

```mermaid
sequenceDiagram
    participant OCC as ops-event-publisher
    participant Bus as Event Backbone
    participant Crew as crew-impact-evaluator
    participant Reaccom as reaccommodation-engine
    participant Trans as guest-translation-layer
    participant Notify as notification-dispatcher
    participant Guest as web/guest-notifications

    OCC->>Bus: publish flight.disrupted.v1 (correlationId=C1)
    Bus-->>Crew: flight.disrupted.v1
    Crew->>Bus: publish crew.legality-check.v1 (correlationId=C1)
    Bus-->>Reaccom: flight.disrupted.v1
    Reaccom->>Bus: publish ops.reaccommodation-generated (correlationId=C1)
    Bus-->>Trans: ops.reaccommodation-generated
    Trans->>Bus: publish guest.itinerary-reaccommodated.v1 (correlationId=C1)
    Bus-->>Notify: guest.itinerary-reaccommodated.v1
    Notify->>Guest: dispatch to APP_PUSH / SMS / EMAIL
    Note over OCC,Guest: One correlationId threads through every hop — see schemas/README.md
```

`crew-impact-evaluator` and `reaccommodation-engine` react to the same `flight.disrupted.v1` event independently and concurrently — this is the fan-out that [ADR 0001](../03-adr/0001-events-not-apis-for-disruption.md) is designed to enable.
