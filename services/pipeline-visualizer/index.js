const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { EventClient } = require('@airline-ops/shared');
const { NODES, TOPICS, TOPIC_NAMES } = require('./topology');

const PORT = process.env.PORT || 4400;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(PUBLIC_DIR, filePath);
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath)] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

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
  server.listen(PORT, () => {
    console.log(`[pipeline-visualizer] http://localhost:${PORT}`);
  });

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
