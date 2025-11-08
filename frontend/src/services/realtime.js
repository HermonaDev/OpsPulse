import { API_BASE_URL } from "../config";

export function connectOrdersWS(baseUrl, onMessage) {
  const apiUrl = baseUrl || API_BASE_URL;
  // Convert http/https to ws/wss
  let wsUrl;
  if (apiUrl.startsWith('http://')) {
    wsUrl = apiUrl.replace('http://', 'ws://') + '/ws/orders';
  } else if (apiUrl.startsWith('https://')) {
    wsUrl = apiUrl.replace('https://', 'wss://') + '/ws/orders';
  } else if (apiUrl.startsWith('/')) {
    // Relative URL - use current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}${apiUrl}/ws/orders`;
  } else {
    // Fallback
    wsUrl = (location.origin.replace(/^http/, 'ws')) + apiUrl + '/ws/orders';
  }
  
  const ws = new WebSocket(wsUrl);
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


