# Pipeline Visualizer

A live view of the actual event fan-out described in [docs/diagrams/container-diagram.md](../../docs/diagrams/container-diagram.md) — not a generic Kafka topic browser, but a diagram of *this* pipeline's topology that animates as disruptions flow through it.

It subscribes (read-only, its own consumer group) to every topic on the bus, and streams each message over WebSocket to a browser page that lights up the producing/consuming service and draws a moving dot between them, colored by `correlationId` so you can visually follow one disruption across the whole fan-out.

This is an observability/demo tool — seeing "are the systems in sync" in this architecture means watching an event reach every service that's supposed to react to it, not database replication or clock sync. See [docs/04-nfr-and-security.md](../../docs/04-nfr-and-security.md#observability) for how this fits into the broader observability picture (a production build would add consumer-lag dashboards and distributed tracing alongside this).

## Running it

```bash
npm install
npm start
# open http://localhost:4400
```

Requires the infra stack (`infra/docker-compose.yml`) up and at least one of the pipeline services (`ops-event-publisher`, `crew-impact-evaluator`, etc.) producing/consuming traffic for anything to animate.
