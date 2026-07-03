// hayao net relay — a dumb WebSocket room hub with zero dependencies.
// Every message from a socket is forwarded verbatim to every OTHER socket in
// the same room; all game intelligence lives in the clients (RoomHost runs in
// the first player's browser). Rooms are the URL path: ws://host:8787/my-room
//
//   npm run relay            # listen on 8787
//   PORT=9000 npm run relay  # custom port
//
// Implements just enough of RFC 6455 for hayao's needs: the upgrade
// handshake, unmasked server→client text frames, masked client→server text
// frames (with 16/64-bit lengths), ping/pong, and close. No extensions, no
// binary payloads, no fragmentation (hayao messages are single JSON frames).

import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_FRAME = 1 << 22; // 4 MiB — snapshots of big worlds still fit
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/** room name → Map<connId, socket state> */
const rooms = new Map();

const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('hayao relay — connect via WebSocket: ws://host/<room>\n');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (req.headers.upgrade?.toLowerCase() !== 'websocket' || !key) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return;
  }
  const room = decodeURIComponent((req.url ?? '/').split('?')[0].replace(/^\/+|\/+$/g, '')) || 'lobby';
  const accept = createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  socket.setNoDelay(true);

  const id = randomUUID();
  if (!rooms.has(room)) rooms.set(room, new Map());
  const peers = rooms.get(room);
  peers.set(id, socket);
  log(`+ ${room} (${peers.size} peer${peers.size === 1 ? '' : 's'})`);

  let buffer = Buffer.alloc(0);

  const leave = () => {
    if (!peers.has(id)) return;
    peers.delete(id);
    if (peers.size === 0) rooms.delete(room);
    log(`- ${room} (${peers.size} left)`);
    socket.destroy();
  };

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    // Parse as many complete frames as the buffer holds.
    for (;;) {
      const frame = readFrame(buffer);
      if (!frame) break;
      buffer = buffer.subarray(frame.consumed);
      switch (frame.opcode) {
        case 0x1: {
          // text → broadcast to the rest of the room
          for (const [peerId, peer] of peers) {
            if (peerId !== id && !peer.destroyed) peer.write(textFrame(frame.payload));
          }
          break;
        }
        case 0x8: // close
          socket.write(controlFrame(0x8, frame.payload));
          leave();
          return;
        case 0x9: // ping → pong
          socket.write(controlFrame(0xa, frame.payload));
          break;
        default:
          break; // pong / binary / continuation — ignored
      }
    }
    if (buffer.length > MAX_FRAME) leave(); // oversized garbage — cut it off
  });

  socket.on('error', leave);
  socket.on('close', leave);
});

/** Parse one client frame (masked) from the head of `buf`, if complete. */
function readFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    const big = buf.readBigUInt64BE(2);
    if (big > BigInt(MAX_FRAME)) return { opcode: 0x8, payload: Buffer.alloc(0), consumed: buf.length };
    len = Number(big);
    offset = 10;
  }
  if (len > MAX_FRAME) return { opcode: 0x8, payload: Buffer.alloc(0), consumed: buf.length };
  const maskLen = masked ? 4 : 0;
  if (buf.length < offset + maskLen + len) return null;
  let payload = buf.subarray(offset + maskLen, offset + maskLen + len);
  if (masked) {
    const mask = buf.subarray(offset, offset + 4);
    const unmasked = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) unmasked[i] = payload[i] ^ mask[i & 3];
    payload = unmasked;
  }
  return { opcode, payload, consumed: offset + maskLen + len };
}

/** Encode an unmasked server→client text frame. */
function textFrame(payload) {
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x81, len]);
  else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function controlFrame(opcode, payload) {
  const p = payload.subarray(0, 125);
  return Buffer.concat([Buffer.from([0x80 | opcode, p.length]), p]);
}

function log(msg) {
  console.log(`[relay] ${msg}`);
}

server.listen(PORT, () => log(`listening on ws://localhost:${server.address().port}/<room>`));
