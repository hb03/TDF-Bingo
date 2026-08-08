/* ============================================================================
   Bingo Live – Cloudflare Worker + Durable Object (WebSocket-Räume)
   ----------------------------------------------------------------------------
   Ein „Raum" (Code, z. B. ABCD) = eine Durable-Object-Instanz.  Alle Clients
   eines Raums halten eine WebSocket-Verbindung; Präsenz (Name + gefundene
   Felder) und Ereignisse (found / bingo) werden an alle im Raum verteilt.

   Protokoll (JSON über WebSocket):
     Client -> Server:
       { t:'join',     id, name, count }
       { t:'presence', id, name, count }
       { t:'event',    id, name, kind:'found'|'bingo', motiv }
       { t:'leave',    id }
     Server -> Client:
       { t:'players', players:[{id,name,count}] }
       { t:'event',   by, name, kind, motiv }

   Es wird nichts dauerhaft gespeichert – der Raum lebt, solange jemand
   verbunden ist.  Nach dem Deploy die wss://…-Adresse in index.html
   (LIVE_WS_URL) eintragen.  Anleitung: LIVE-SETUP-cloudflare.md
   ========================================================================== */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('bingo-live ok', { headers: { 'access-control-allow-origin': '*' } });
    }

    // /room/CODE  ->  WebSocket-Upgrade an das Durable Object dieses Raums
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]{1,12})$/);
    if (m) {
      if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
        return new Response('WebSocket-Upgrade erwartet', { status: 426 });
      }
      const code = m[1].toUpperCase();
      const stub = env.ROOM.get(env.ROOM.idFromName(code));
      return stub.fetch(request);
    }

    return new Response('not found', { status: 404 });
  }
};

export class Room {
  constructor(state, env) {
    this.state = state;
    // ws  ->  { id, name, count }
    this.sessions = new Map();
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const meta = { id: null, name: '', count: 0 };
    this.sessions.set(server, meta);

    server.addEventListener('message', (evt) => {
      let m;
      try { m = JSON.parse(evt.data); } catch (_) { return; }
      if (!m || typeof m !== 'object') return;

      if (m.t === 'join' || m.t === 'presence') {
        meta.id = String(m.id || meta.id || '').slice(0, 40);
        meta.name = String(m.name || '').slice(0, 24);
        meta.count = (m.count | 0);
        this.broadcastPlayers();
      } else if (m.t === 'event') {
        this.broadcast({
          t: 'event',
          by: String(m.id || '').slice(0, 40),
          name: String(m.name || '').slice(0, 24),
          kind: m.kind === 'bingo' ? 'bingo' : 'found',
          motiv: String(m.motiv || '').slice(0, 60)
        });
      } else if (m.t === 'leave') {
        this.sessions.delete(server);
        try { server.close(1000, 'bye'); } catch (_) {}
        this.broadcastPlayers();
      }
    });

    const bye = () => { this.sessions.delete(server); this.broadcastPlayers(); };
    server.addEventListener('close', bye);
    server.addEventListener('error', bye);

    return new Response(null, { status: 101, webSocket: client });
  }

  playersList() {
    const out = [];
    for (const meta of this.sessions.values()) {
      if (meta.id) out.push({ id: meta.id, name: meta.name, count: meta.count });
    }
    return out;
  }

  broadcastPlayers() {
    this.broadcast({ t: 'players', players: this.playersList() });
  }

  broadcast(obj) {
    const s = JSON.stringify(obj);
    for (const ws of this.sessions.keys()) {
      try { ws.send(s); } catch (_) {}
    }
  }
}
