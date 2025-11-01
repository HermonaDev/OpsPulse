import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import KpiCard from "../components/KpiCard";
import AgentMap from "../components/AgentMap";
import OrdersTable from "../components/OrdersTable";
import PendingUsersCard from "../components/PendingUsersCard";
import ApproveOrderModal from "../components/ApproveOrderModal";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { fetchOrders, fetchUsers, updateOrderStatus, approveOrder, fetchLocations, fetchVehicles } from "../services/api";
import { connectOrdersWS } from "../services/realtime";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const wsRef = useRef(null);
  const [approveModalOrder, setApproveModalOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const sidebarItems = [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  // Calculate real KPIs from data
  const activeOrders = orders.filter(o => 
    ["approved", "picked_up", "in_transit"].includes(o.status)
  ).length;
  const agentsOnline = users.filter(u => u.role === "agent").length; // Could be enhanced with last seen timestamp
  const completedCount = orders.filter(o => o.status === "delivered").length;
  
  const kpis = [
    { 
      label: "Active Orders", 
      value: `${activeOrders}`, 
      sublabel: "Now", 
      trend: { up: activeOrders > 0, value: activeOrders > 0 ? `+${activeOrders}` : "0" } 
    },
    { 
      label: "Agents Online", 
      value: `${agentsOnline}`, 
      sublabel: "Total Agents", 
      trend: { up: agentsOnline > 0, value: agentsOnline > 0 ? `${agentsOnline} active` : "0" } 
    },
    { 
      label: "Completed", 
      value: `${completedCount}`, 
      sublabel: "Total Delivered", 
      trend: { up: completedCount > 0, value: completedCount > 0 ? `${completedCount}` : "0" } 
    },
  ];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [o, u, locs, v] = await Promise.all([
          fetchOrders(undefined, user?.token),
          fetchUsers(undefined, user?.token),
          fetchLocations(undefined, user?.token).catch(() => []),
          fetchVehicles(undefined, user?.token).catch(() => []),
        ]);
        if (!active) return;
        setOrders(o);
        setUsers(u);
        setLocations(locs);
        setVehicles(v);
        // Add notifications for any pending orders that were just loaded
        const pendingCount = o.filter(order => order.status === "pending").length;
        if (pendingCount > 0) {
          setNotifications((prev) => [{
            type: "INFO",
            message: `${pendingCount} pending order${pendingCount > 1 ? 's' : ''} awaiting approval`,
            timestamp: new Date(),
          }, ...prev].slice(0, 10));
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [user?.token]);

  function refreshUsers() {
    fetchUsers(undefined, user?.token).then(setUsers).catch(()=>{});
  }

  useEffect(() => {
    if (!user?.token) return;
    const ws = connectOrdersWS(undefined, (msg) => {
      try {
        if (msg.event === "order_created") {
          setOrders((prev) => {
            // Check if order already exists to avoid duplicates
            const exists = prev.some(o => o.id === msg.order_id);
            if (exists) return prev;
            return [{ id: msg.order_id, customer_name: msg.customer_name, status: "pending" }, ...prev];
          });
          // Add notification for new order
          setNotifications((prev) => [{
            type: "INFO",
            message: `New order #${msg.order_id} from ${msg.customer_name || 'Unknown'}`,
            timestamp: new Date(),
          }, ...prev].slice(0, 10));
        } else if (msg.event === "order_status") {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === msg.order_id ? { ...o, status: msg.new_status } : o));
          return updated;
        });
        // Add notification for agent assignment
        if (msg.assigned_agent_id) {
          setUsers((prevUsers) => {
            const agent = prevUsers?.find(u => u.id === msg.assigned_agent_id);
            if (agent) {
              setNotifications((prevNotif) => [{
                type: "INFO",
                message: `Order #${msg.order_id} assigned to agent ${agent.name}`,
                timestamp: new Date(),
              }, ...prevNotif].slice(0, 10));
            }
            return prevUsers;
          });
        }
      } else if (msg.event === "user_signup") {
        // refresh users immediately when new signup, approval, or rejection happens
        refreshUsers();
        // Add notification for new user registration
        setNotifications((prev) => [{
          type: "INFO",
          message: `New user registration: ${msg.name} (${msg.email})`,
          timestamp: new Date(),
        }, ...prev].slice(0, 10));
      } else if (msg.event === "user_role_updated" || msg.event === "user_deleted") {
        refreshUsers();
      } else if (msg.event === "location_update") {
        // Refresh locations when updated
        fetchLocations(undefined, user?.token).then(setLocations).catch(() => {});
        // Update vehicle location if agent is assigned to a vehicle
        setVehicles((prev) => {
          return prev.map(v => 
            v.assigned_agent_id === msg.agent_id 
              ? { ...v, current_latitude: msg.latitude, current_longitude: msg.longitude }
              : v
          );
        });
      } else if (msg.event === "vehicle_registered" || msg.event === "vehicle_approved") {
        // Refresh vehicles when updated
        fetchVehicles(undefined, user?.token).then(setVehicles).catch(() => {});
      }
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    });
    wsRef.current = ws;
    return () => ws.close();
  }, [user?.token]);

  function toneFor(status) {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (s === "delivered") return "success";
    if (s === "in_transit") return "info";
    if (s === "picked_up") return "info";
    if (s === "approved") return "info";
    if (s === "pending") return "warning";
    if (s.includes("delay")) return "warning";
    return "neutral";
  }

  async function handleApprove(orderId, agentId) {
    const updated = await approveOrder(orderId, agentId, undefined, user?.token);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setApproveModalOrder(null);
  }

  const pendingOrders = orders.filter(o => o.status === "pending");

  const orderRows = (orders || []).slice(0, 5).map((o) => {
    const agent = users?.find(u => u.id === o.assigned_agent_id);
    return {
      id: `#${o.id}`,
      agent: agent?.name || "—",
      agentPhone: agent?.phone || "",
      status: o.status || "pending",
      statusTone: toneFor(o.status),
      date: o.updated_at || o.created_at || "",
      rawId: o.id,
      assignedAgentId: o.assigned_agent_id,
    };
  });

  async function handleReassign(row) {
    setApproveModalOrder(orders.find(o => o.id === row.rawId) || null);
  }

  function handleContact(row) {
    // Contact button already handled by OrdersTable component
    // It shows/hides phone number
  }

  return (
    <Layout
      sidebar={<Sidebar title="OpsPulse" items={sidebarItems} />}
      topbar={<Topbar title="Admin Dashboard" />}
    >
      <ApproveOrderModal
        isOpen={!!approveModalOrder}
        onClose={() => setApproveModalOrder(null)}
        onApprove={handleApprove}
        order={approveModalOrder}
        token={user?.token}
        locations={locations}
      />
      
      <PendingUsersCard users={users} token={user?.token} onApproved={refreshUsers} />

      {pendingOrders.length > 0 && (
        <div className="bg-bg-secondary/90 rounded-2xl border border-accent/30 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-bold text-accent">Pending Orders - Review Required</div>
            <Badge tone="warning">{pendingOrders.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="bg-bg-primary/40 rounded-lg p-4 border border-bg-primary/60 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-text-primary font-bold">Order #{order.id}</span>
                    <Badge tone={toneFor(order.status)}>{order.status}</Badge>
                  </div>
                  <div className="text-sm text-text-secondary">
                    <div>Customer: {order.customer_name}</div>
                    <div>Address: {order.delivery_address}</div>
                  </div>
                </div>
                <button
                  onClick={() => setApproveModalOrder(order)}
                  className="px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium text-sm"
                >
                  Review & Assign
                </button>
              </div>
            ))}
            {pendingOrders.length > 5 && (
              <div className="text-center text-sm text-text-secondary">
                {pendingOrders.length - 5} more pending orders...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 mt-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <AgentMap 
            locations={locations} 
            users={users} 
            orders={orders}
            vehicles={vehicles}
            onAssignToNearest={async (orderId, agentId) => {
              try {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                  await approveOrder(orderId, agentId, undefined, user?.token);
                  // Refresh orders
                  const updated = await fetchOrders(undefined, user?.token);
                  setOrders(updated);
                }
              } catch (err) {
                console.error("Failed to assign order:", err);
              }
            }}
            onMarkerClick={(marker) => {
              // Could open a detailed modal here
              console.log("Marker clicked:", marker);
            }}
          />
        </div>
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-5">
          <div className="text-xl font-bold text-accent mb-3">Notifications</div>
          <ul className="space-y-3 text-sm text-text-secondary max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="text-text-secondary/60 italic">No notifications</li>
            ) : (
              notifications.map((notif, idx) => (
                <li key={idx}>
                  <span className={`font-medium ${
                    notif.type === "ALERT" ? "text-orange-400" : "text-accent"
                  }`}>{notif.type}</span>: {notif.message}
                  <div className="text-xs text-text-secondary/60 mt-1">
                    {notif.timestamp.toLocaleTimeString()}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-accent">Recent Orders</span>
          <button onClick={()=>navigate('/orders')} className="bg-accent text-bg-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition">View All</button>
        </div>
        <OrdersTable rows={orderRows} onReassign={handleReassign} onContact={handleContact} />
      </div>

      <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-5 mb-6">
        <div className="text-xl font-bold text-accent mb-3">Users (live)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-text-secondary/80 border-b border-bg-primary/60">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(users || []).map((u) => (
                <tr key={u.id} className="border-b border-bg-primary/60 hover:bg-bg-primary/40 transition">
                  <td className="px-5 py-3 text-text-primary">{u.id}</td>
                  <td className="px-5 py-3 text-text-primary">{u.name}</td>
                  <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-5 py-3 text-text-secondary">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}