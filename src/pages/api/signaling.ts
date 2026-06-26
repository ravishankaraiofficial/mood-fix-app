import type { APIRoute } from 'astro';

// In-memory store (transient, specific to this Cloudflare isolate)
const rooms = new Map<string, WebSocket[]>();

export const GET: APIRoute = async ({ request }) => {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // @ts-ignore
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair) as WebSocket[];

  // @ts-ignore
  server.accept();

  let currentRoom: string | null = null;

  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      
      if (data.type === 'join') {
        const { room } = data;
        currentRoom = room;
        if (!rooms.has(room)) {
          rooms.set(room, []);
        }
        
        const clients = rooms.get(room)!;
        if (clients.length >= 2) {
          server.send(JSON.stringify({ type: 'error', message: 'Room full' }));
          return;
        }
        
        clients.push(server);
        
        // Notify others in room
        clients.forEach(c => {
          if (c !== server) {
            c.send(JSON.stringify({ type: 'peer_joined' }));
          }
        });
      } else if (currentRoom) {
        // Relay SDP / ICE candidates to the OTHER peer in the room
        const clients = rooms.get(currentRoom);
        if (clients) {
          clients.forEach(c => {
            if (c !== server) {
              c.send(JSON.stringify(data));
            }
          });
        }
      }
    } catch (e) {
      console.error('Signaling error', e);
    }
  });

  server.addEventListener('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const clients = rooms.get(currentRoom)!;
      const updatedClients = clients.filter(c => c !== server);
      if (updatedClients.length === 0) {
        rooms.delete(currentRoom);
      } else {
        rooms.set(currentRoom, updatedClients);
        updatedClients.forEach(c => c.send(JSON.stringify({ type: 'peer_left' })));
      }
    }
  });

  return new Response(null, {
    status: 101,
    // @ts-ignore
    webSocket: client,
  });
};
