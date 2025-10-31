export function connectOrdersWS(baseUrl, onMessage) {
  const origin = baseUrl || (location.origin.replace(/^http/, 'ws'));
  const ws = new WebSocket(`${origin}/api/ws/orders`);
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage?.(msg);
    } catch {
      // ignore bad payloads
    }
  };
  return ws;
}


