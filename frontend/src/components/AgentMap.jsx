import React from "react";

export default function AgentMap({ locations = [], users = [], orders = [], onAssignToNearest }) {
  // For demo, using OpenStreetMap with markers
  // In production, use Leaflet or Mapbox
  const centerLat = 8.9806; // Addis Ababa center
  const centerLon = 38.7578;
  const zoom = 13;

  // Create markers for agents with locations
  const markers = locations.map(loc => {
    const agent = users.find(u => u.id === loc.agent_id);
    const activeOrder = orders.find(o => o.assigned_agent_id === loc.agent_id && ["approved", "picked_up", "in_transit"].includes(o.status));
    return {
      ...loc,
      agent,
      activeOrder,
      markerUrl: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+92D30A(${loc.longitude},${loc.latitude})/${loc.longitude},${loc.latitude},${zoom}/400x300?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`
    };
  });

  // If we have markers, center map on them
  const mapSrc = markers.length > 0 && markers[0]
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${markers[0].longitude - 0.05}%2C${markers[0].latitude - 0.05}%2C${markers[0].longitude + 0.05}%2C${markers[0].latitude + 0.05}&layer=mapnik&marker=${markers[0].latitude}%2C${markers[0].longitude}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=38.7457%2C8.9406%2C38.7707%2C8.9906&layer=mapnik`;

  return (
    <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-4">
      <div className="w-full h-96 rounded-xl overflow-hidden border border-accent/30 relative">
        <iframe
          src={mapSrc}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Agent Locations Map"
          className="pointer-events-none"
        />
        {/* Overlay with agent info */}
        <div className="absolute top-2 right-2 bg-bg-primary/95 backdrop-blur rounded-lg p-3 max-w-xs text-xs">
          <div className="font-bold text-accent mb-2">Agents on Map ({markers.length})</div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {markers.map((marker, i) => (
              <div key={i} className="border-b border-bg-primary/60 pb-1 mb-1">
                <div className="text-text-primary font-medium">{marker.agent?.name || `Agent #${marker.agent_id}`}</div>
                <div className="text-text-secondary text-[10px]">
                  {marker.activeOrder ? `Order #${marker.activeOrder.id}` : "Available"}
                </div>
              </div>
            ))}
            {markers.length === 0 && (
              <div className="text-text-secondary">No agent locations available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

