import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';

interface PipelineNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface TopicSpec {
  producedBy: string;
  consumedBy: string[];
}

interface PipelineEvent {
  type: 'event';
  topic: string;
  producedBy: string;
  consumedBy: string[];
  correlationId: string;
  flightNumber?: string;
  timestamp: string;
}

// The backend is services/pipeline-visualizer — a pure WebSocket bridge that taps
// every Kafka topic (its own read-only consumer group) and streams events here.
// It stays a separate Node process because kafkajs needs a real TCP connection
// to the broker, which a browser can't open.
const WEBSOCKET_URL = 'ws://localhost:4400';

@Component({
  selector: 'app-pipeline-visualizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pipeline-visualizer.component.html',
  styleUrls: ['./pipeline-visualizer.component.css'],
  // Nodes/edges/dots are appended imperatively (see renderTopology/animateDot) rather
  // than through Angular's template compiler, so emulated view encapsulation's
  // [_ngcontent] attribute never lands on them. None keeps the CSS below applying
  // to elements this component creates by hand.
  encapsulation: ViewEncapsulation.None,
})
export class PipelineVisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('edgesEl', { static: true }) edgesRef!: ElementRef<SVGSVGElement>;
  @ViewChild('nodesEl', { static: true }) nodesRef!: ElementRef<HTMLDivElement>;
  @ViewChild('dotsEl', { static: true }) dotsRef!: ElementRef<HTMLDivElement>;
  @ViewChild('feedListEl', { static: true }) feedListRef!: ElementRef<HTMLDivElement>;

  connected = false;

  private socket?: WebSocket;
  private reconnectTimer?: number;
  private nodesById: Record<string, PipelineNode> = {};

  ngAfterViewInit(): void {
    this.connect();
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
    }
  }

  private connect(): void {
    this.socket = new WebSocket(WEBSOCKET_URL);
    this.socket.onopen = () => (this.connected = true);
    this.socket.onclose = () => {
      this.connected = false;
      this.reconnectTimer = window.setTimeout(() => this.connect(), 2000);
    };
    this.socket.onerror = () => this.socket?.close();
    this.socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'topology') {
        this.renderTopology(data.nodes, data.topics);
      } else if (data.type === 'event') {
        this.handleEvent(data);
      }
    };
  }

  private renderTopology(nodes: PipelineNode[], topics: Record<string, TopicSpec>): void {
    this.nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));

    const nodesEl = this.nodesRef.nativeElement;
    nodesEl.innerHTML = '';
    for (const node of nodes) {
      const el = document.createElement('div');
      el.className = 'pv-node';
      el.id = `pv-node-${node.id}`;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      el.textContent = node.label;
      nodesEl.appendChild(el);
    }

    const svg = this.edgesRef.nativeElement;
    svg.innerHTML = `
      <defs>
        <marker id="pv-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#334155" />
        </marker>
      </defs>
    `;
    for (const spec of Object.values(topics)) {
      const from = this.nodesById[spec.producedBy];
      if (!from) continue;
      for (const consumerId of spec.consumedBy) {
        const to = this.nodesById[consumerId];
        if (!to) continue;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(from.x));
        line.setAttribute('y1', String(from.y));
        line.setAttribute('x2', String(to.x));
        line.setAttribute('y2', String(to.y));
        svg.appendChild(line);
      }
    }
  }

  private pulseNode(id: string): void {
    const el = document.getElementById(`pv-node-${id}`);
    if (!el) return;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 700);
  }

  private correlationColor(correlationId: string): string {
    let hash = 0;
    for (let i = 0; i < correlationId.length; i++) {
      hash = (hash * 31 + correlationId.charCodeAt(i)) >>> 0;
    }
    return `hsl(${hash % 360}, 85%, 60%)`;
  }

  private animateDot(fromId: string, toId: string, color: string): void {
    const from = this.nodesById[fromId];
    const to = this.nodesById[toId];
    if (!from || !to) return;

    const dot = document.createElement('div');
    dot.className = 'pv-dot';
    dot.style.color = color;
    dot.style.background = color;
    this.dotsRef.nativeElement.appendChild(dot);

    const durationMs = 650;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      dot.style.left = `${from.x + (to.x - from.x) * t}px`;
      dot.style.top = `${from.y + (to.y - from.y) * t}px`;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        dot.remove();
        this.pulseNode(toId);
      }
    };
    requestAnimationFrame(step);
  }

  private addFeedItem(event: PipelineEvent): void {
    const color = this.correlationColor(event.correlationId || '');
    const item = document.createElement('div');
    item.className = 'pv-feed-item';
    item.style.borderLeftColor = color;
    const time = new Date(event.timestamp).toLocaleTimeString();
    item.innerHTML = `
      <div class="pv-topic">${event.topic}</div>
      <div class="pv-meta">${event.flightNumber || ''} · ${time}</div>
      <div class="pv-meta">${(event.correlationId || '').slice(0, 8)}…</div>
    `;
    const feedListEl = this.feedListRef.nativeElement;
    feedListEl.prepend(item);
    while (feedListEl.children.length > 40) {
      feedListEl.removeChild(feedListEl.lastChild as ChildNode);
    }
  }

  private handleEvent(event: PipelineEvent): void {
    const color = this.correlationColor(event.correlationId || '');
    this.pulseNode(event.producedBy);
    for (const consumerId of event.consumedBy) {
      this.animateDot(event.producedBy, consumerId, color);
    }
    this.addFeedItem(event);
  }
}
