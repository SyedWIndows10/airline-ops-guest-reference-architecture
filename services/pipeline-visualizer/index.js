const { WebSocketServer } = require('ws');
const { EventClient } = require('@airline-ops/shared');
const { NODES, TOPICS, TOPIC_NAMES } = require('./topology');

const PORT = process.env.PORT || 4400;

// This service is a pure WebSocket bridge — it has no frontend of its own. The
// diagram lives inside web/ (Angular route /pipeline, see
// web/src/app/pipeline-visualizer/), which connects here directly. Keeping the
// Kafka-tapping bridge as its own Node process (rather than in the browser) is
// necessary because kafkajs needs a real TCP connection to the broker, which a
// browser can't open.
const wss = new WebSocketServer({ port: PORT });

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'topology', nodes: NODES, topics: TOPICS }));
});

const client = new EventClient({ clientId: 'pipeline-visualizer' });

async function main() {
  console.log(`[pipeline-visualizer] WebSocket bridge listening on ws://localhost:${PORT}`);
  console.log(`[pipeline-visualizer] subscribing to ${TOPIC_NAMES.join(', ')}`);
  await client.consume({
    groupId: 'pipeline-visualizer',
    topics: TOPIC_NAMES,
    handler: async (payload, { topic }) => {
      broadcast({
        type: 'event',
        topic,
        producedBy: TOPICS[topic].producedBy,
        consumedBy: TOPICS[topic].consumedBy,
        correlationId: payload.correlationId,
        flightNumber: payload.flightNumber || payload.originalFlightNumber,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

main().catch((err) => {
  console.error('[pipeline-visualizer] fatal error', err);
  process.exit(1);
});
