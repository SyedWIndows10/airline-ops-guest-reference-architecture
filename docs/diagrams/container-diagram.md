# Container Diagram

```mermaid
graph TB
    Publisher["ops-event-publisher\n(Node.js)"]
    Bus[["Event Backbone\nKafka / Redpanda"]]
    Crew["crew-impact-evaluator\n(Node.js)"]
    Eng["engineering-defect-linker\n(Node.js, stub)"]
    Reaccom["reaccommodation-engine\n(Node.js)"]
    Translate["guest-translation-layer\n(Node.js)"]
    Notify["notification-dispatcher\n(Node.js)"]
    ODS[("ODS\nPostgres")]
    Lakehouse[("Lakehouse\nParquet")]
    ETL["etl/*\n(Python)"]
    OpsWeb["web/ops-dashboard\n(Angular)"]
    GuestWeb["web/guest-notifications\n(Angular)"]
    VectorStore[("SOP Vector Store\nJSON")]
    QueryAPI["ai-assistant/query_api\n(Node.js)"]

    Publisher -->|flight.disrupted.v1| Bus
    Bus --> Crew
    Bus --> Eng
    Bus --> Reaccom
    Bus --> ETL
    Reaccom -->|ops.reaccommodation-generated| Translate
    Translate -->|guest.itinerary-reaccommodated.v1| Notify
    Crew -->|crew.legality-check.v1| ETL
    ETL --> ODS
    ETL --> Lakehouse
    ODS --> OpsWeb
    Notify --> GuestWeb
    QueryAPI --> VectorStore
```

Each Node.js box in `services/` is an independently deployable process with its own `package.json` — see [ADR 0001](../03-adr/0001-events-not-apis-for-disruption.md) for why they communicate only through the event backbone.
