import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { fetchOrders } from "../services/api";

export default function CargoPage() {
  const { user } = useAuth();
  const [cargoOrders, setCargoOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const orders = await fetchOrders(undefined, user?.token);
        if (!active) return;
        // Show only active (non-delivered) cargo shipments
        const activeOrders = orders.filter(o => 
          o.status && !o.status.toLowerCase().includes("delivered")
        );
        setCargoOrders(activeOrders);
      } catch (e) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.token]);

  const isAdmin = user?.role === "admin";
  const sidebarItems = [
    { label: "Dashboard", href: isAdmin ? "/dashboard/admin" : "/dashboard/owner" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  function toneFor(status) {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (s.includes("deliver")) return "success";
    if (s.includes("transit") || s.includes("ship")) return "info";
    if (s.includes("pending")) return "warning";
    return "neutral";
  }

  return (
    <Layout 
      sidebar={<Sidebar title={isAdmin ? "OpsPulse" : "OpsPulse Owner"} items={sidebarItems} />} 
      topbar={<Topbar title="Cargo Operations" />}
    >
      <div className="space-y-6">
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
          <div className="text-xl font-bold text-accent mb-4">Active Cargo Shipments</div>
          {loading ? (
            <div className="text-text-secondary">Loading...</div>
          ) : cargoOrders.length === 0 ? (
            <div className="text-text-secondary">No active cargo shipments</div>
          ) : (
            <div className="space-y-4">
              {cargoOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-bg-primary/40 rounded-lg p-4 border border-bg-primary/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-text-primary font-bold">#{order.id}</span>
                        <Badge tone={toneFor(order.status)}>{order.status || "pending"}</Badge>
                      </div>
                      <div className="text-sm text-text-secondary">
                        <div>Customer: {order.customer_name || "Unknown"}</div>
                        <div>Delivery Address: {order.delivery_address || "—"}</div>
                        {order.assigned_agent_id && (
                          <div>Agent ID: {order.assigned_agent_id}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
          <div className="text-lg font-bold text-accent mb-2">About Cargo Operations</div>
          <div className="text-sm text-text-secondary">
            <p className="mb-2">
              The Cargo page focuses on active shipments and cargo-specific operations, 
              while the Orders page shows all order types including general deliveries.
            </p>
            <p>
              This view provides real-time tracking of cargo shipments, their status, 
              assigned agents, and delivery details.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

