import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { updateOrderStatus, fetchOrders, updateLocation, fetchVehicles } from "../services/api";
import Badge from "../components/Badge";
import VehicleSelectionModal from "../components/VehicleSelectionModal";

function SwipeRow({ stop, onUpdateStatus, onPickupClick, getNextStatus, getStatusLabel }) {
  const nextStatus = getNextStatus(stop.status);
  
  return (
    <div className="bg-bg-secondary/90 border-b border-bg-primary/60 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-text-primary font-medium truncate">{stop.id} • {stop.to}</div>
          <div className="text-xs text-text-secondary">Customer: {stop.customer}</div>
        </div>
        <Badge tone={stop.status === "delivered" ? "success" : stop.status === "in_transit" ? "info" : stop.status === "picked_up" ? "info" : stop.status === "approved" ? "info" : "warning"}>
          {getStatusLabel(stop.status)}
        </Badge>
      </div>
      {nextStatus && (
        <button
          onClick={() => {
            if (stop.status === "approved" && nextStatus === "picked_up") {
              // Trigger vehicle selection for pickup
              if (onPickupClick) {
                onPickupClick(stop.order);
              } else {
                onUpdateStatus(stop.order, nextStatus);
              }
            } else {
              onUpdateStatus(stop.order, nextStatus);
            }
          }}
          className="w-full mt-2 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium text-sm"
        >
          {stop.status === "approved" ? "Pick Up Order" : `Mark as ${getStatusLabel(nextStatus)}`}
        </button>
      )}
    </div>
  );
}

export default function AgentMobile() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [pendingOrderForPickup, setPendingOrderForPickup] = useState(null);
  
  // Location tracking state
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const locationIntervalRef = useRef(null);
  const watchIdRef = useRef(null);

  // Get agent ID from token
  const agentId = user?.token ? (() => {
    try {
      const tokenParts = user.token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        return payload.user_id;
      }
    } catch {}
    return null;
  })() : null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOrders(undefined, user?.token);
        if (!active) return;
        // Filter to only show orders assigned to this agent
        const assignedOrders = agentId 
          ? data.filter(o => o.assigned_agent_id === agentId && o.status !== "delivered")
          : data.filter(o => o.status !== "delivered");
        setOrders(assignedOrders.sort((a, b) => {
          // Sort by status priority: approved < picked_up < in_transit
          const priority = { "approved": 1, "picked_up": 2, "in_transit": 3 };
          return (priority[a.status] || 0) - (priority[b.status] || 0);
        }));
      } catch (e) {
        // Error handled
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.token, agentId]);

  // Load available vehicles
  useEffect(() => {
    if (user?.token) {
      fetchVehicles(undefined, user.token)
        .then(data => {
          // Get vehicles assigned to this agent or available vehicles
          const vehicles = data.filter(v => 
            v.approval_status === "approved" && 
            (v.assigned_agent_id === agentId || v.status === "available")
          );
          setAvailableVehicles(vehicles);
          // Auto-select vehicle if agent is assigned to one
          const assignedVehicle = vehicles.find(v => v.assigned_agent_id === agentId);
          if (assignedVehicle) {
            setSelectedVehicleId(assignedVehicle.id);
          }
        })
        .catch(() => {
          // Error handled
        });
    }
  }, [user?.token, agentId]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const currentOrder = orders.find(o => o.status === "in_transit" || o.status === "picked_up") || orders[0];
  const stops = orders.map(o => ({
    id: `#${o.id}`,
    order: o,
    to: o.delivery_address,
    customer: o.customer_name,
    status: o.status,
    eta: "—",
    distance: "—"
  }));

  function getNextStatus(currentStatus) {
    if (currentStatus === "approved") return "picked_up";
    if (currentStatus === "picked_up") return "in_transit";
    if (currentStatus === "in_transit") return "delivered";
    return null;
  }

  function getStatusLabel(status) {
    const labels = {
      "approved": "Approved",
      "picked_up": "Picked Up",
      "in_transit": "In Transit",
      "delivered": "Delivered",
      "pending": "Pending"
    };
    return labels[status] || status;
  }

  async function updateStatus(order, newStatus, vehicleId = null) {
    try {
      const updated = await updateOrderStatus(order.id, newStatus, undefined, user?.token, vehicleId);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      alert(`Order #${order.id} marked as ${getStatusLabel(newStatus)}`);
    } catch (e) {
      alert(`Failed to update: ${e.message || "Unknown error"}`);
    }
  }

  function handlePickupClick(order) {
    if (order.status === "approved") {
      setPendingOrderForPickup(order);
      setShowVehicleModal(true);
    }
  }

  function handleVehicleSelected(vehicleId) {
    if (pendingOrderForPickup) {
      updateStatus(pendingOrderForPickup, "picked_up", vehicleId);
      setPendingOrderForPickup(null);
    }
  }

  async function markDelivered(stop) {
    if (stop.order.status !== "in_transit") {
      alert("Order must be in transit before marking as delivered");
      return;
    }
    await updateStatus(stop.order, "delivered");
  }

  // Location tracking functions
  async function sendLocationUpdate(latitude, longitude) {
    if (!agentId || !user?.token) return;
    
    setUpdatingLocation(true);
    try {
      await updateLocation({
        agent_id: agentId,
        latitude,
        longitude,
      }, undefined, user.token);
      setCurrentLocation({ latitude, longitude });
      setLocationError(null);
    } catch (error) {
      console.error("Failed to update location:", error);
      setLocationError("Failed to update location");
    } finally {
      setUpdatingLocation(false);
    }
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationUpdate(latitude, longitude);
      },
      (error) => {
        let message = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out";
        }
        setLocationError(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function startLocationTracking() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsTrackingLocation(true);
    setLocationError(null);

    // Send initial location
    getCurrentLocation();

    // Watch position for real-time updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationUpdate(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Location tracking error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Also send periodic updates every 30 seconds as backup
    locationIntervalRef.current = setInterval(() => {
      getCurrentLocation();
    }, 30000);
  }

  function stopLocationTracking() {
    setIsTrackingLocation(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationIntervalRef.current !== null) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <VehicleSelectionModal
        isOpen={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false);
          setPendingOrderForPickup(null);
        }}
        onSelect={handleVehicleSelected}
        token={user?.token}
      />
      <div className="max-w-md mx-auto">
        {/* Top Navbar */}
        <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur px-4 py-3 border-b border-bg-secondary/60 flex items-center gap-3">
          <button onClick={handleLogout} className="w-9 h-9 rounded-lg bg-bg-secondary text-text-primary grid place-items-center">⟵</button>
          <div className="flex-1 min-w-0">
            {currentOrder ? (
              <>
                <div className="text-xs text-text-secondary flex items-center gap-2 mb-1">
                  <Badge tone={currentOrder.status === "in_transit" ? "info" : currentOrder.status === "picked_up" ? "info" : "warning"}>
                    {getStatusLabel(currentOrder.status)}
                  </Badge>
                </div>
                <div className="text-sm text-text-primary truncate">{currentOrder.delivery_address}</div>
                <div className="text-xs text-text-secondary">Customer: {currentOrder.customer_name}</div>
              </>
            ) : (
              <>
                <div className="text-xs text-text-secondary">No active orders</div>
                <div className="text-sm text-text-primary">No current delivery</div>
              </>
            )}
          </div>
          {currentOrder && currentOrder.status === "in_transit" && (
            <button 
              onClick={() => updateStatus(currentOrder, "delivered")}
              className="px-3 py-2 rounded-lg bg-accent text-bg-primary text-xs font-semibold"
            >
              Delivered
            </button>
          )}
        </div>

        {/* Map */}
        <div className="px-4 py-3">
          <div className="w-full h-64 overflow-hidden rounded-xl border border-accent/30">
            <iframe
              title="Navigation Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=38.7457%2C8.9406%2C38.7707%2C8.9906&layer=mapnik"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>

        {/* Stops List with Swipe */}
        <div className="mx-0">
          <div className="px-4 py-2 text-xs text-text-secondary">Assigned Orders ({orders.length})</div>
          {loading ? (
            <div className="text-text-secondary text-center py-8 bg-bg-secondary/40">Loading orders...</div>
          ) : stops.length === 0 ? (
            <div className="text-text-secondary text-center py-8 bg-bg-secondary/40">No assigned orders</div>
          ) : (
            <ul className="bg-bg-secondary/40">
              {stops.map((s) => (
                <li key={s.id}>
                  <SwipeRow 
                    stop={s} 
                    onUpdateStatus={updateStatus}
                    onPickupClick={handlePickupClick}
                    getNextStatus={getNextStatus}
                    getStatusLabel={getStatusLabel}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Location Tracking Section */}
        <div className="px-4 py-3 bg-bg-secondary/40 border-t border-bg-primary/60">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-text-primary">Location Tracking</div>
              <div className={`w-2 h-2 rounded-full ${isTrackingLocation ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
            {currentLocation && (
              <div className="text-xs text-text-secondary mb-2">
                📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </div>
            )}
            {locationError && (
              <div className="text-xs text-red-400 mb-2">{locationError}</div>
            )}
          </div>

          {/* Vehicle Selection (Optional) */}
          {availableVehicles.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs text-text-secondary mb-1">
                Vehicle (Optional)
              </label>
              <select
                value={selectedVehicleId || ""}
                onChange={(e) => setSelectedVehicleId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary text-xs focus:outline-none focus:border-accent"
              >
                <option value="">None</option>
                {availableVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.model} - {vehicle.license_plate}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            {!isTrackingLocation ? (
              <button
                onClick={startLocationTracking}
                className="flex-1 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium text-sm flex items-center justify-center gap-2"
                disabled={updatingLocation}
              >
                {updatingLocation ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Updating...
                  </>
                ) : (
                  <>
                    📍 Start Tracking
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={getCurrentLocation}
                  className="flex-1 px-3 py-2 bg-bg-primary text-text-primary border border-bg-primary/60 rounded-lg hover:bg-bg-primary/80 transition text-sm"
                  disabled={updatingLocation}
                >
                  {updatingLocation ? "Updating..." : "Update Now"}
                </button>
                <button
                  onClick={stopLocationTracking}
                  className="flex-1 px-3 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition font-medium text-sm"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer Tabs */}
        <div className="sticky bottom-0 bg-bg-secondary/80 backdrop-blur border-t border-bg-primary/60 px-4 py-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button className="py-2 rounded-lg bg-accent/20 text-accent font-medium">Queue</button>
            <button className="py-2 rounded-lg bg-bg-primary text-text-primary border border-bg-primary/60">Home</button>
            <button className="py-2 rounded-lg bg-bg-primary text-text-primary border border-bg-primary/60">Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}