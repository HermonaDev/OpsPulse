import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { updateOrderStatus, fetchOrders } from "../services/api";
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOrders(undefined, user?.token);
        if (!active) return;
        // Filter to only show orders assigned to this agent
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
  }, [user?.token]);

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