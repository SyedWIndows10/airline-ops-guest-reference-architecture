# Pipeline Visualizer (WebSocket bridge)

A pure WebSocket bridge — it taps every topic on the bus (its own read-only consumer group) and streams events to whatever's connected. It has no frontend of its own: the live diagram lives inside the Angular app at [web/src/app/pipeline-visualizer/](../../web/src/app/pipeline-visualizer/), served as the `/pipeline` route of `web/`.

It stays a separate Node process rather than living inside the browser because `kafkajs` needs a real TCP connection to the broker, which a browser can't open directly.

See [docs/diagrams/container-diagram.md](../../docs/diagrams/container-diagram.md) for the topology this bridges, and [docs/04-nfr-and-security.md](../../docs/04-nfr-and-security.md#observability) for how this fits the observability story — it's a small working stand-in for real distributed tracing.

## Running it

```bash
npm install
npm start
# WebSocket bridge now listening on ws://localhost:4400
```

Then run the Angular app (`cd web && npm install && npm start`) and open `http://localhost:4200/pipeline`. Requires the infra stack (`infra/docker-compose.yml`) up and at least one pipeline service producing/consuming traffic for anything to animate.
