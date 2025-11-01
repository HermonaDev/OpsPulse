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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter function for search
  function filterOrders(orderList) {
    if (!searchQuery.trim()) return orderList;
    const query = searchQuery.toLowerCase();
    return orderList.filter(o => 
      o.id?.toString().toLowerCase().includes(query) ||
      o.customer_name?.toLowerCase().includes(query) ||
      o.delivery_address?.toLowerCase().includes(query) ||
      o.status?.toLowerCase().includes(query)
    );
  }

  // Separate orders by lifecycle
  const pendingOrders = filterOrders((orders || []).filter(o => o.status === "pending"));
  const activeOrders = filterOrders((orders || []).filter(o => 
    ["approved", "picked_up", "in_transit"].includes(o.status)
  ));
  const pastOrders = filterOrders((orders || []).filter(o => o.status === "delivered"));

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
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by order ID, customer name, address, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg-secondary/90 border border-bg-primary/60 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <div className="text-xl font-bold text-accent mb-4">Pending Orders (Awaiting Approval)</div>
            {pendingRows.length > 0 ? (
              <OrdersTable rows={pendingRows} />
            ) : (
              <div className="text-text-secondary bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
                No pending orders
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-accent mb-4">Active Orders</div>
            {activeRows.length > 0 ? (
              <OrdersTable rows={activeRows} />
            ) : (
              <div className="text-text-secondary bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
                No active orders
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-accent mb-4">Delivered Orders</div>
            {pastRows.length > 0 ? (
              <OrdersTable rows={pastRows} />
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


