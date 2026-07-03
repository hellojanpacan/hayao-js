// Transports: how bytes move between peers. All transports are BUSES — send()
// reaches every other peer on the same medium. That matches BroadcastChannel
// (multi-tab), a dumb WebSocket relay (one room = one bus), and the in-memory
// loopback hub (tests) with a single semantics, so sessions never care which
// one they run on. Addressing, when needed, lives in the message (`to` field).

export interface Transport {
  /** Deliver to every other peer on the bus. */
  send(data: string): void;
  /** Subscribe to incoming data. Returns an unsubscribe function. */
  onMessage(cb: (data: string) => void): () => void;
  /** Fires when the transport goes away (socket close, hub shutdown). */
  onClose(cb: () => void): () => void;
  close(): void;
  readonly isOpen: boolean;
}

// ── loopback: deterministic in-memory bus for tests ─────────────

export interface LoopbackOptions {
  /** Delivery delay in ticks (calls to hub.tick()). Default 0 = next tick. */
  delay?: number;
  /** Drop every Nth message (deterministic loss pattern). 0 = lossless. */
  dropEvery?: number;
}

interface QueuedMessage {
  data: string;
  from: number;
  dueTick: number;
  seq: number;
}

/**
 * An in-memory bus with explicit, deterministic time: nothing is delivered
 * until `tick()` runs, messages arrive in send order, and loss follows a fixed
 * pattern. Network tests stay exactly reproducible — no timers, no races.
 */
export class LoopbackHub {
  private peers: LoopbackTransport[] = [];
  private queue: QueuedMessage[] = [];
  private tickCount = 0;
  private seq = 0;
  private sent = 0;
  private readonly delay: number;
  private readonly dropEvery: number;

  constructor(opts: LoopbackOptions = {}) {
    this.delay = opts.delay ?? 0;
    this.dropEvery = opts.dropEvery ?? 0;
  }

  /** Create a new endpoint on this bus. */
  connect(): LoopbackTransport {
    const t = new LoopbackTransport(this, this.peers.length);
    this.peers.push(t);
    return t;
  }

  /** @internal */
  enqueue(data: string, from: number): void {
    this.sent++;
    if (this.dropEvery > 0 && this.sent % this.dropEvery === 0) return;
    this.queue.push({ data, from, dueTick: this.tickCount + this.delay, seq: this.seq++ });
  }

  /** Advance one network tick, delivering everything that is due. */
  tick(): void {
    const due = this.queue.filter((m) => m.dueTick <= this.tickCount).sort((a, b) => a.seq - b.seq);
    this.queue = this.queue.filter((m) => m.dueTick > this.tickCount);
    this.tickCount++;
    for (const m of due) {
      for (const peer of this.peers) {
        if (peer.peerIndex !== m.from && peer.isOpen) peer.deliver(m.data);
      }
    }
  }

  /** Deliver everything in flight (repeated ticks until the queue drains). */
  flush(): void {
    while (this.queue.length > 0) this.tick();
  }

  get pending(): number {
    return this.queue.length;
  }
}

export class LoopbackTransport implements Transport {
  private listeners: Array<(data: string) => void> = [];
  private closeListeners: Array<() => void> = [];
  private open = true;

  constructor(
    private readonly hub: LoopbackHub,
    readonly peerIndex: number,
  ) {}

  send(data: string): void {
    if (this.open) this.hub.enqueue(data, this.peerIndex);
  }
  onMessage(cb: (data: string) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }
  onClose(cb: () => void): () => void {
    this.closeListeners.push(cb);
    return () => {
      this.closeListeners = this.closeListeners.filter((l) => l !== cb);
    };
  }
  close(): void {
    if (!this.open) return;
    this.open = false;
    for (const cb of this.closeListeners) cb();
  }
  get isOpen(): boolean {
    return this.open;
  }
  /** @internal */
  deliver(data: string): void {
    for (const cb of this.listeners) cb(data);
  }
}

// ── BroadcastChannel: zero-server multi-tab play ────────────────

/**
 * A bus over the browser's BroadcastChannel — every tab on the same origin
 * that opens the same room name is a peer. Perfect for local two-tab netplay
 * and demos: no server at all.
 */
export class BroadcastChannelTransport implements Transport {
  private channel: BroadcastChannel;
  private listeners: Array<(data: string) => void> = [];
  private closeListeners: Array<() => void> = [];
  private open = true;

  constructor(room: string) {
    this.channel = new BroadcastChannel(`hayao-net:${room}`);
    this.channel.onmessage = (e: MessageEvent) => {
      if (typeof e.data === 'string') for (const cb of this.listeners) cb(e.data);
    };
  }

  send(data: string): void {
    if (this.open) this.channel.postMessage(data);
  }
  onMessage(cb: (data: string) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }
  onClose(cb: () => void): () => void {
    this.closeListeners.push(cb);
    return () => {
      this.closeListeners = this.closeListeners.filter((l) => l !== cb);
    };
  }
  close(): void {
    if (!this.open) return;
    this.open = false;
    this.channel.close();
    for (const cb of this.closeListeners) cb();
  }
  get isOpen(): boolean {
    return this.open;
  }
}

// ── WebSocket: real network play via the relay ──────────────────

/**
 * A bus over a WebSocket to the hayao relay (`npm run relay`): everyone
 * connected to the same room URL is a peer; the relay forwards each message to
 * the room's other sockets. Resolves once the socket is open.
 */
export function connectWebSocket(url: string): Promise<Transport> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const listeners: Array<(data: string) => void> = [];
    const closeListeners: Array<() => void> = [];
    let open = false;

    const transport: Transport = {
      send(data: string) {
        if (open) ws.send(data);
      },
      onMessage(cb) {
        listeners.push(cb);
        return () => {
          const i = listeners.indexOf(cb);
          if (i >= 0) listeners.splice(i, 1);
        };
      },
      onClose(cb) {
        closeListeners.push(cb);
        return () => {
          const i = closeListeners.indexOf(cb);
          if (i >= 0) closeListeners.splice(i, 1);
        };
      },
      close() {
        open = false;
        ws.close();
      },
      get isOpen() {
        return open;
      },
    };

    ws.onopen = () => {
      open = true;
      resolve(transport);
    };
    ws.onmessage = (e: MessageEvent) => {
      if (typeof e.data === 'string') for (const cb of listeners) cb(e.data);
    };
    ws.onclose = () => {
      const wasOpen = open;
      open = false;
      if (wasOpen) for (const cb of closeListeners) cb();
    };
    ws.onerror = () => {
      if (!open) reject(new Error(`hayao-net: could not connect to ${url}`));
    };
  });
}
