const statusEl = document.getElementById('status');
const nodesEl = document.getElementById('nodes');
const edgesEl = document.getElementById('edges');
const dotsEl = document.getElementById('dots');
const feedListEl = document.getElementById('feed-list');

let nodesById = {};
let topics = {};

function setStatus(connected) {
  statusEl.textContent = connected ? 'connected' : 'disconnected';
  statusEl.className = `status ${connected ? 'connected' : 'disconnected'}`;
}

function renderTopology(nodes, topicMap) {
  nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  topics = topicMap;

  nodesEl.innerHTML = '';
  for (const node of nodes) {
    const el = document.createElement('div');
    el.className = 'node';
    el.id = `node-${node.id}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.textContent = node.label;
    nodesEl.appendChild(el);
  }

  edgesEl.innerHTML = `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
        <path d="M0,0 L0,6 L9,3 z" fill="#334155" />
      </marker>
    </defs>
  `;
  for (const [, spec] of Object.entries(topicMap)) {
    const from = nodesById[spec.producedBy];
    if (!from) continue;
    for (const consumerId of spec.consumedBy) {
      const to = nodesById[consumerId];
      if (!to) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      edgesEl.appendChild(line);
    }
  }
}

function pulseNode(id) {
  const el = document.getElementById(`node-${id}`);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

function correlationColor(correlationId) {
  let hash = 0;
  for (let i = 0; i < correlationId.length; i++) {
    hash = (hash * 31 + correlationId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 85%, 60%)`;
}

function animateDot(fromId, toId, color) {
  const from = nodesById[fromId];
  const to = nodesById[toId];
  if (!from || !to) return;

  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.style.color = color;
  dot.style.background = color;
  dotsEl.appendChild(dot);

  const durationMs = 650;
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / durationMs, 1);
    dot.style.left = `${from.x + (to.x - from.x) * t}px`;
    dot.style.top = `${from.y + (to.y - from.y) * t}px`;
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      dot.remove();
      pulseNode(toId);
    }
  }
  requestAnimationFrame(step);
}

function addFeedItem(event) {
  const color = correlationColor(event.correlationId || '');
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.style.borderLeftColor = color;
  const time = new Date(event.timestamp).toLocaleTimeString();
  item.innerHTML = `
    <div class="topic">${event.topic}</div>
    <div class="meta">${event.flightNumber || ''} · ${time}</div>
    <div class="meta">${(event.correlationId || '').slice(0, 8)}…</div>
  `;
  feedListEl.prepend(item);
  while (feedListEl.children.length > 40) {
    feedListEl.removeChild(feedListEl.lastChild);
  }
}

function handleEvent(event) {
  const color = correlationColor(event.correlationId || '');
  pulseNode(event.producedBy);
  for (const consumerId of event.consumedBy) {
    animateDot(event.producedBy, consumerId, color);
  }
  addFeedItem(event);
}

function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${proto}://${location.host}`);

  socket.onopen = () => setStatus(true);
  socket.onclose = () => {
    setStatus(false);
    setTimeout(connect, 2000);
  };
  socket.onerror = () => socket.close();

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === 'topology') {
      renderTopology(data.nodes, data.topics);
    } else if (data.type === 'event') {
      handleEvent(data);
    }
  };
}

connect();
