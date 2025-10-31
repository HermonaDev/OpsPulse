import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import OrdersTable from "../components/OrdersTable";
import { fetchOrders, updateOrderStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOrders(undefined, user?.token);
        if (!active) return;
        setOrders(data);
      } catch (e) {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.token]);

  async function delayOrder(orderId) {
    try {
      const updated = await updateOrderStatus(orderId, "delayed", undefined, user?.token);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (e) {
      // no-op
    }
  }

  // Separate orders by lifecycle
  const pendingOrders = (orders || []).filter(o => o.status === "pending");
  const activeOrders = (orders || []).filter(o => 
    ["approved", "picked_up", "in_transit"].includes(o.status)
  );
  const pastOrders = (orders || []).filter(o => o.status === "delivered");

  function statusTone(status) {
    if (status === "delivered") return "success";
    if (["in_transit", "picked_up", "approved"].includes(status)) return "info";
    if (status === "pending") return "warning";
    return "neutral";
  }

  const pendingRows = pendingOrders.map((o) => ({
    id: `#${o.id}`,
    agent: o.assigned_agent_id || "Unassigned",
    status: o.status || "pending",
    statusTone: statusTone(o.status),
    date: o.updated_at || o.created_at || "",
    rawId: o.id,
  }));

  const activeRows = activeOrders.map((o) => ({
    id: `#${o.id}`,
    agent: o.assigned_agent_id || "—",
    status: o.status || "unknown",
    statusTone: statusTone(o.status),
    date: o.updated_at || o.created_at || "",
    rawId: o.id,
  }));

  const pastRows = pastOrders.map((o) => ({
    id: `#${o.id}`,
    agent: o.assigned_agent_id || "—",
    status: o.status || "delivered",
    statusTone: "success",
    date: o.updated_at || o.created_at || "",
    rawId: o.id,
  }));

  return (
    <Layout sidebar={<Sidebar title={isAdmin ? "OpsPulse" : "OpsPulse Owner"} items={[
      { label: "Dashboard", href: isAdmin ? "/dashboard/admin" : "/dashboard/owner" },
      { label: "Orders", href: "/orders" },
      { label: "Agents", href: "/agents" },
      { label: "Fleet", href: "/fleet" },
      { label: "Cargo", href: "/cargo" },
      { label: "Settings", href: "/settings" },
    ]} />} topbar={<Topbar title="Orders" /> }>
      {loading ? (
        <div className="text-text-secondary">Loading…</div>
      ) : error ? (
        <div className="text-text-secondary">{error}</div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="text-xl font-bold text-accent mb-4">Pending Orders (Awaiting Approval)</div>
            {pendingRows.length > 0 ? (
              <OrdersTable rows={pendingRows} onDelay={(r)=>delayOrder(r.rawId)} />
            ) : (
              <div className="text-text-secondary bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
                No pending orders
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-accent mb-4">Active Orders</div>
            {activeRows.length > 0 ? (
              <OrdersTable rows={activeRows} onDelay={(r)=>delayOrder(r.rawId)} />
            ) : (
              <div className="text-text-secondary bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
                No active orders
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-accent mb-4">Delivered Orders</div>
            {pastRows.length > 0 ? (
              <OrdersTable rows={pastRows} onDelay={(r)=>delayOrder(r.rawId)} />
            ) : (
              <div className="text-text-secondary bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
                No delivered orders
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}


