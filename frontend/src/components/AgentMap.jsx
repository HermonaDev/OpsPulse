import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRoute } from "../services/routing";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
// Create a custom SVG-based human icon for agents
function createHumanIcon(color = "#3b82f6") {
  // Create SVG for human/person icon - person silhouette
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="16" cy="10" r="4.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 8 19 Q 8 15.5 16 15.5 Q 24 15.5 24 19 L 24 28 L 8 28 Z" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: "agent-human-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const humanAgentIcon = createHumanIcon("#3b82f6"); // Blue color for agents

const vehicleIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const orderIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const pickupIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to auto-fit map to markers
function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function AgentMap({ locations = [], users = [], orders = [], vehicles = [], onAssignToNearest, onMarkerClick }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const centerLat = 8.9806; // Addis Ababa center
  const centerLon = 38.7578;
  const zoom = 13;

  // Get agent locations with user info
  const agentMarkers = locations.map(loc => {
    const agent = users.find(u => u.id === loc.agent_id);
    const activeOrders = orders.filter(o => 
      o.assigned_agent_id === loc.agent_id && 
      ["approved", "picked_up", "in_transit"].includes(o.status)
    );
    const vehicle = vehicles.find(v => v.assigned_agent_id === loc.agent_id);
    return {
      type: "agent",
      id: `agent-${loc.agent_id}`,
      lat: loc.latitude,
      lng: loc.longitude,
      agent,
      activeOrders,
      vehicle,
      timestamp: loc.timestamp,
    };
  });

  // Get vehicle locations (use agent location if assigned, otherwise use vehicle's own location)
  const vehicleMarkers = vehicles
    .filter(v => v.approval_status === "approved")
    .map(vehicle => {
      // If vehicle has assigned agent, use agent's location
      const agentLoc = locations.find(l => l.agent_id === vehicle.assigned_agent_id);
      const vehicleOrders = orders.filter(o => o.vehicle_id === vehicle.id);
      
      return {
        type: "vehicle",
        id: `vehicle-${vehicle.id}`,
        lat: agentLoc ? agentLoc.latitude : (vehicle.current_latitude || null),
        lng: agentLoc ? agentLoc.longitude : (vehicle.current_longitude || null),
        vehicle,
        agent: users.find(u => u.id === vehicle.assigned_agent_id),
        vehicleOrders,
      };
    })
    .filter(v => v.lat && v.lng); // Only show vehicles with valid coordinates

  // Get order markers (delivery points)
  const orderMarkers = orders
    .filter(o => o.delivery_latitude && o.delivery_longitude && ["pending", "approved", "picked_up", "in_transit"].includes(o.status))
    .map(order => {
      const agent = users.find(u => u.id === order.assigned_agent_id);
      const vehicle = vehicles.find(v => v.id === order.vehicle_id);
      return {
        type: "order",
        id: `order-${order.id}`,
        lat: order.delivery_latitude,
        lng: order.delivery_longitude,
        order,
        agent,
        vehicle,
      };
    });

  // Get pickup markers
  const pickupMarkers = orders
    .filter(o => o.pickup_latitude && o.pickup_longitude && ["pending", "approved", "picked_up", "in_transit"].includes(o.status))
    .map(order => ({
      type: "pickup",
      id: `pickup-${order.id}`,
      lat: order.pickup_latitude,
      lng: order.pickup_longitude,
      order,
    }));

  // Calculate bounds for all markers
  const allMarkers = [...agentMarkers, ...vehicleMarkers, ...orderMarkers, ...pickupMarkers];
  const bounds = allMarkers.length > 0
    ? allMarkers.map(m => [m.lat, m.lng])
    : [[centerLat, centerLon]];

  // Calculate distance between two points (Haversine formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Find nearest agent to an order
  function findNearestAgent(orderLat, orderLng) {
    if (!orderLat || !orderLng) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    agentMarkers.forEach(marker => {
      const distance = calculateDistance(orderLat, orderLng, marker.lat, marker.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = marker.agent;
      }
    });
    
    return nearest ? { agent: nearest, distance: minDistance.toFixed(2) } : null;
  }

  function handleMarkerClick(marker) {
    setSelectedMarker(marker);
    onMarkerClick?.(marker);
  }

  // Generate route polylines for orders with both pickup and delivery using actual road routes
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    async function loadRoutes() {
      const ordersWithCoords = orders.filter(
        o => o.pickup_latitude && o.pickup_longitude && o.delivery_latitude && o.delivery_longitude
      );

      if (ordersWithCoords.length === 0) {
        setRoutes([]);
        return;
      }

      console.log(`Loading routes for ${ordersWithCoords.length} orders...`);

      const routePromises = ordersWithCoords.map(async (order) => {
        try {
          console.log(`🗺️ Getting route for order ${order.id} from (${order.pickup_latitude}, ${order.pickup_longitude}) to (${order.delivery_latitude}, ${order.delivery_longitude})`);
          
          const route = await getRoute(
            { latitude: order.pickup_latitude, longitude: order.pickup_longitude },
            { latitude: order.delivery_latitude, longitude: order.delivery_longitude }
          );
          
          console.log(`✅ Route for order ${order.id}: ${route.points.length} points (real route: ${route.points.length > 2 ? 'YES' : 'NO - straight line'})`);
          
          // Only return if we have a real route (more than 2 points)
          if (route.points && route.points.length > 2) {
            return {
              orderId: order.id,
              points: route.points,
              distance: route.distance,
              duration: route.duration,
              order,
            };
          } else {
            console.warn(`⚠️ Order ${order.id}: Route has only ${route.points.length} points - using fallback`);
            throw new Error('Route has insufficient points');
          }
        } catch (error) {
          console.error(`Failed to get route for order ${order.id}:`, error);
          // Fallback to straight line with intermediate points
          const lat1 = order.pickup_latitude;
          const lon1 = order.pickup_longitude;
          const lat2 = order.delivery_latitude;
          const lon2 = order.delivery_longitude;
          
          // Create intermediate points for smoother line
          const numPoints = Math.max(10, Math.floor(Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 100));
          const points = [];
          for (let i = 0; i <= numPoints; i++) {
            const ratio = i / numPoints;
            points.push([
              lat1 + (lat2 - lat1) * ratio,
              lon1 + (lon2 - lon1) * ratio
            ]);
          }
          
          return {
            orderId: order.id,
            points,
            distance: null,
            duration: null,
            order,
          };
        }
      });

      const loadedRoutes = await Promise.all(routePromises);
      
      if (isMounted) {
        console.log(`Loaded ${loadedRoutes.length} routes`);
        setRoutes(loadedRoutes);
      }
    }

    if (orders.length > 0) {
      loadRoutes();
    } else {
      setRoutes([]);
    }
    
    return () => {
      isMounted = false;
    };
  }, [orders]);

  return (
    <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-bold text-accent">Fleet & Delivery Map</div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-text-secondary">Agents</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-text-secondary">Vehicles</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-text-secondary">Orders</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-text-secondary">Pickup</span>
          </div>
        </div>
      </div>
      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-accent/30 relative">
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={zoom}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds bounds={bounds} />
          
          {/* Agent markers */}
          {agentMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={humanAgentIcon}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-blue-600 mb-1">👤 Agent: {marker.agent?.name || `#${marker.agent_id}`}</div>
                  {marker.agent?.phone && <div>📞 {marker.agent.phone}</div>}
                  {marker.activeOrders.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold">Active Orders:</div>
                      {marker.activeOrders.map(o => (
                        <div key={o.id} className="text-xs">Order #{o.id} - {o.status}</div>
                      ))}
                    </div>
                  )}
                  {marker.vehicle && (
                    <div className="mt-1 text-xs">🚚 Vehicle: {marker.vehicle.license_plate}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Last seen: {marker.timestamp ? new Date(marker.timestamp).toLocaleTimeString() : "N/A"}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Vehicle markers */}
          {vehicleMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={vehicleIcon}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-green-600 mb-1">🚚 Vehicle: {marker.vehicle.license_plate}</div>
                  <div>Model: {marker.vehicle.model}</div>
                  <div>Type: {marker.vehicle.vehicle_type}</div>
                  <div>Status: {marker.vehicle.status}</div>
                  {marker.agent && <div>Driver: {marker.agent.name}</div>}
                  {marker.vehicleOrders.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold">Assigned Orders:</div>
                      {marker.vehicleOrders.map(o => (
                        <div key={o.id} className="text-xs">Order #{o.id}</div>
                      ))}
                    </div>
                  )}
              </div>
              </Popup>
            </Marker>
          ))}

          {/* Delivery point markers */}
          {orderMarkers.map(marker => {
            const nearest = findNearestAgent(marker.lat, marker.lng);
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={orderIcon}
                eventHandlers={{
                  click: () => handleMarkerClick(marker),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-red-600 mb-1">📦 Order #{marker.order.id}</div>
                    <div>Customer: {marker.order.customer_name}</div>
                    <div className="text-xs">Address: {marker.order.delivery_address}</div>
                    <div>Status: {marker.order.status}</div>
                    {marker.agent && <div>Agent: {marker.agent.name}</div>}
                    {marker.vehicle && <div>Vehicle: {marker.vehicle.license_plate}</div>}
                    {nearest && marker.order.status === "pending" && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs font-semibold">Nearest Agent:</div>
                        <div className="text-xs">{nearest.agent.name} ({nearest.distance} km away)</div>
                        {onAssignToNearest && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignToNearest(marker.order.id, nearest.agent.id);
                            }}
                            className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Assign to Nearest
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Pickup point markers */}
          {pickupMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={pickupIcon}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-orange-600 mb-1">📍 Pickup: Order #{marker.order.id}</div>
                  {marker.order.pickup_address && <div className="text-xs">Address: {marker.order.pickup_address}</div>}
                  <div className="text-xs">Status: {marker.order.status}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route lines */}
          {routes.map(route => (
            <Polyline
              key={`route-${route.orderId}`}
              positions={route.points}
              color="#3b82f6"
              weight={3}
              opacity={0.6}
            />
          ))}
        </MapContainer>

        {/* Info panel */}
        <div className="absolute bottom-4 left-4 right-4 bg-bg-primary/95 backdrop-blur rounded-lg p-3 text-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="font-bold text-accent">{agentMarkers.length}</div>
              <div className="text-text-secondary">Agents</div>
            </div>
            <div>
              <div className="font-bold text-green-400">{vehicleMarkers.length}</div>
              <div className="text-text-secondary">Vehicles</div>
            </div>
            <div>
              <div className="font-bold text-red-400">{orderMarkers.length}</div>
              <div className="text-text-secondary">Active Orders</div>
            </div>
            <div>
              <div className="font-bold text-orange-400">{pickupMarkers.length}</div>
              <div className="text-text-secondary">Pickups</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected marker details panel */}
      {selectedMarker && (
        <div className="mt-4 bg-bg-primary/40 rounded-lg p-4 border border-bg-primary/60">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-accent">
              {selectedMarker.type === "agent" && `Agent: ${selectedMarker.agent?.name}`}
              {selectedMarker.type === "vehicle" && `Vehicle: ${selectedMarker.vehicle?.license_plate}`}
              {selectedMarker.type === "order" && `Order #${selectedMarker.order?.id}`}
              {selectedMarker.type === "pickup" && `Pickup: Order #${selectedMarker.order?.id}`}
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-text-secondary hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          {selectedMarker.type === "agent" && (
            <div className="text-sm text-text-secondary space-y-1">
              {selectedMarker.agent?.phone && <div>Phone: {selectedMarker.agent.phone}</div>}
              <div>Location: {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}</div>
              {selectedMarker.activeOrders.length > 0 && (
                <div>
                  Active Orders: {selectedMarker.activeOrders.map(o => `#${o.id}`).join(", ")}
                </div>
              )}
            </div>
          )}
          {selectedMarker.type === "vehicle" && (
            <div className="text-sm text-text-secondary space-y-1">
              <div>Model: {selectedMarker.vehicle?.model}</div>
              <div>Type: {selectedMarker.vehicle?.vehicle_type}</div>
              <div>Status: {selectedMarker.vehicle?.status}</div>
              {selectedMarker.agent && <div>Driver: {selectedMarker.agent.name}</div>}
            </div>
          )}
          {selectedMarker.type === "order" && (
            <div className="text-sm text-text-secondary space-y-1">
              <div>Customer: {selectedMarker.order?.customer_name}</div>
              <div>Address: {selectedMarker.order?.delivery_address}</div>
              <div>Status: {selectedMarker.order?.status}</div>
              {selectedMarker.agent && <div>Assigned Agent: {selectedMarker.agent.name}</div>}
              {selectedMarker.vehicle && <div>Vehicle: {selectedMarker.vehicle.license_plate}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
