# Context Diagram

```mermaid
graph LR
    OCC[OCC / Ops Systems]
    Maint[Maintenance System]
    PSS[PSS / Reservation System]
    Guest((Guest))
    DutyMgr[Duty Manager]

    subgraph "airline-ops-guest-reference-architecture"
        Bus[Event Backbone\nKafka / Redpanda]
        Ops[Ops-domain services]
        GuestSvc[Guest-domain services]
        Analytics[Analytics / Lakehouse]
        Assistant[SOP Assistant]
    end

    OCC -->|flight.disrupted.v1| Bus
    Maint -.->|MEL/defect lookup, mocked| Ops
    Bus --> Ops
    Ops -->|guest-translation-layer boundary| GuestSvc
    GuestSvc -->|notifications| Guest
    PSS -.->|guest lookup, mocked| GuestSvc
    Bus --> Analytics
    DutyMgr -->|SOP questions| Assistant
    Assistant -->|cited answers| DutyMgr
```

This is the system-in-context view: real OCC, maintenance, and PSS systems are mocked at their integration boundary (see [ADR 0004](../03-adr/0004-legacy-protocol-adapter-pattern.md)); everything inside the box is this repo.
