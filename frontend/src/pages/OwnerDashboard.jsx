import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import KpiCard from "../components/KpiCard";
import Badge from "../components/Badge";
import CreateOrderModal from "../components/CreateOrderModal";
import { useAuth } from "../context/AuthContext";
import { fetchOrders, createOrder } from "../services/api";
import { connectOrdersWS } from "../services/realtime";

// Demo/mock data
const cargoOrders = [
  {
    id: "EF-0097001346",
    distance: "28km",
    late: "35 minutes late",
    from: "12 Bridge Rd, Ultimo NSW 2007",
    to: "25 Sussex St, Sydney NSW 2000",
    eta: "1h 45m",
    driver: { name: "Ahmad Prasetyo", phone: "+62-813-9874-1123", hours: "3h 25m", rest: "45m" },
    vehicle: {
      model: "Hino Ranger FL8J",
      status: "In Transit",
      image: 
        "https://hinobalintawak.com.ph/wp-content/uploads/2020/09/FL8JW7A-Euro-4.png"},
  },
  // Add more orders if you want...
];

function CargoDetailCard({ cargo }) {
  return (
    <div className="bg-bg-secondary rounded-xl shadow px-8 py-6 grid grid-cols-2 min-h-36 mb-6 items-center gap-x-10">
      {/* LEFT COLUMN */}
      <div>
        <div className="font-bold text-lg text-text-primary mb-1">{cargo.driver.name}</div>
        <div className="text-xs text-text-secondary mb-4">{cargo.driver.phone}</div>
        <div className="mt-8 mb-3">
          <div className="text-xs text-text-secondary">From:</div>
          <div className="font-semibold text-text-primary">{cargo.from}</div>
        </div>
        <div>
          <div className="text-xs text-text-secondary">To:</div>
          <div className="font-semibold text-text-primary">{cargo.to}</div>
        </div>
      </div>
      {/* RIGHT COLUMN */}
      <div className="flex flex-col h-full justify-center items-start">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-bg-primary text-xs text-text-secondary px-2 py-1 rounded">{cargo.id}</span>
          <span className="ml-1 text-orange-400">🚚</span>
          <span className="font-bold text-base text-text-primary">{cargo.vehicle.model}</span>
          <span className="ml-2 text-xs font-medium bg-accent text-bg-primary rounded px-2 py-1">{cargo.vehicle.status}</span>
        </div>
        <div className="flex items-center gap-10 mt-2 mb-7">
          <div>
            <span className="text-text-secondary text-xs">ETA:</span>
            <span className="font-bold text-base text-text-primary ml-2">{cargo.eta}</span>
          </div>
          <div>
            <span className="text-text-secondary text-xs">Distance:</span>
            <span className="font-bold text-base text-text-primary ml-2">{cargo.distance}</span>
          </div>
          <span className={cargo.late ? "text-red-500 font-bold ml-8" : "text-green-500 font-bold ml-8"}>
            {cargo.late ? cargo.late : "On time"}
          </span>
        </div>
        <div className="flex justify-end w-full">
          <img src={cargo.vehicle.image} alt={cargo.vehicle.model} className="h-24 object-contain" />
        </div>
      </div>
    </div>
  );
}


function Sparkline({ points = [] }) {
  if (points.length === 0) return <div className="h-8" />;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = (v) => (max === min ? 50 : ((v - min) / (max - min)) * 100);
  const d = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${100 - norm(v)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8">
      <polyline fill="none" stroke="#92D30A" strokeWidth="2" points={d} />
    </svg>
  );
}

function BarChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1">
          <div
            className="w-full bg-accent/70 rounded-t"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <div className="text-[10px] text-text-secondary mt-1 text-center truncate">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const [recentSeries, setRecentSeries] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Initialize recentSeries from current order count when orders are loaded
  useEffect(() => {
    if (recentSeries.length === 0) {
      if (orders.length > 0) {
        // Use actual order count
        const currentCount = orders.length;
        setRecentSeries(Array(7).fill(currentCount));
      } else {
        // Use dummy data if no orders
        setRecentSeries([5, 7, 6, 9, 11, 8, 10]);
      }
    }
  }, [orders, recentSeries.length]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOrders(undefined, user?.token);
        if (!active) return;
        setOrders(data);
      } catch (e) {
        // keep demo if backend not reachable or token invalid
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;
    
    // Get user_id from token to filter websocket events
    let ownerUserId = null;
    try {
      const tokenParts = user.token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        ownerUserId = payload.user_id;
      }
    } catch (e) {
      // Failed to decode, will filter by API instead
    }
    
    const ws = connectOrdersWS(undefined, (msg) => {
      // Only process orders that belong to this owner
      if (msg.event === "order_created") {
        // If owner_id is in message and user is owner, only add if it matches
        if (user?.role === "owner" && ownerUserId && msg.owner_id !== ownerUserId) {
          return; // Skip this order, it doesn't belong to this owner
        }
        // Update series based on actual order count
        setOrders((prev) => {
          const exists = prev.some(o => o.id === msg.order_id);
          if (exists) return prev;
          
          const newOrders = [{ id: msg.order_id, customer_name: msg.customer_name, status: "pending" }, ...prev];
          // Update series with actual order count
          const orderCount = newOrders.length;
          setRecentSeries((prevSeries) => {
            if (prevSeries.length === 0) {
              return Array(7).fill(orderCount);
            }
            return [...prevSeries.slice(-6), orderCount];
          });
          return newOrders;
        });
        setAlerts((prevAlerts) => [{
          type: msg.event,
          text: `New order #${msg.order_id}`,
          ts: Date.now(),
        }, ...prevAlerts].slice(0, 20));
      } else if (msg.event === "order_status") {
        // If owner_id is in message and user is owner, only process if it matches
        if (user?.role === "owner" && ownerUserId && msg.owner_id !== ownerUserId) {
          return; // Skip this update, it doesn't belong to this owner
        }
        // Only update if order exists in our list (meaning it belongs to owner)
        setOrders((prev) => {
          const orderExists = prev.some(o => o.id === msg.order_id);
          if (orderExists) {
            // Update alerts for orders we own
            setAlerts((prevAlerts) => [{
              type: msg.event,
              text: `Order #${msg.order_id} → ${msg.new_status}`,
              ts: Date.now(),
            }, ...prevAlerts].slice(0, 20));
            const updated = prev.map((o) => (o.id === msg.order_id ? { ...o, status: msg.new_status } : o));
            // Update series with actual order count after status change
            setRecentSeries((prevSeries) => {
              if (prevSeries.length === 0) {
                return Array(7).fill(updated.length);
              }
              return [...prevSeries.slice(-6), updated.length];
            });
            return updated;
          }
          return prev;
        });
      }
    });
    wsRef.current = ws;
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    return () => ws.close();
  }, [user?.token, user?.role]);

  // Alert rule: delayed > 45 min for non-delivered orders
  useEffect(() => {
    const now = Date.now();
    const delayed = orders.filter((o) => {
      const updatedAt = o.updated_at ? new Date(o.updated_at).getTime() : (o.created_at ? new Date(o.created_at).getTime() : now);
      const minutes = (now - updatedAt) / 60000;
      return o.status && o.status !== "delivered" && minutes > 45;
    });
    if (delayed.length > 0) {
      setAlerts((prev) => [
        { type: "delay", text: `${delayed.length} delivery${delayed.length > 1 ? "ies" : ""} delayed > 45 min`, ts: now },
        ...prev,
      ].slice(0, 20));
    }
  }, [orders]);

  const sidebarItems = [
    { label: "Dashboard", href: "/dashboard/owner" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  // Calculate KPIs from actual orders data
  const pendingCount = orders.filter(o => 
    o.status && !o.status.toLowerCase().includes("delivered")
  ).length;
  const deliveredCount = orders.filter(o => 
    o.status && o.status.toLowerCase().includes("delivered")
  ).length;
  const successRate = orders.length > 0 
    ? Math.round((deliveredCount / orders.length) * 100) 
    : 0;

  const kpis = [
    { label: "Revenue", value: "ETB 41,200", sublabel: "Monthly", trend: { up: true, value: "+12%" } },
    { label: "Delivery Success", value: `${successRate}%`, sublabel: "Overall", trend: { up: successRate >= 90, value: successRate >= 90 ? "+2%" : "-2%" } },
    { label: "Orders Pending", value: `${pendingCount}`, sublabel: "Current", trend: { up: false, value: pendingCount > 0 ? `+${pendingCount}` : "0" } },
  ];

  // recentSeries state is updated by websocket events

  // Calculate daily revenue from actual orders
  const revenueBars = useMemo(() => {
    // Check if we have delivered orders to show real data
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    
    if (!orders || orders.length === 0 || deliveredOrders.length === 0) {
      // Use dummy data if no orders or no delivered orders
      return [
        { label: "Mon", value: 12 },
        { label: "Tue", value: 8 },
        { label: "Wed", value: 15 },
        { label: "Thu", value: 10 },
        { label: "Fri", value: 18 },
        { label: "Sat", value: 7 },
        { label: "Sun", value: 5 },
      ];
    }

    // Group orders by day of week (0 = Sunday, 1 = Monday, etc.)
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    
    deliveredOrders.forEach(order => {
      const date = order.created_at ? new Date(order.created_at) : (order.updated_at ? new Date(order.updated_at) : new Date());
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      dayCounts[dayOfWeek] += 1;
    });

    // Map to days starting from Monday (shift array)
    return [
      { label: "Mon", value: dayCounts[1] || 0 },
      { label: "Tue", value: dayCounts[2] || 0 },
      { label: "Wed", value: dayCounts[3] || 0 },
      { label: "Thu", value: dayCounts[4] || 0 },
      { label: "Fri", value: dayCounts[5] || 0 },
      { label: "Sat", value: dayCounts[6] || 0 },
      { label: "Sun", value: dayCounts[0] || 0 },
    ];
  }, [orders]);

  const rows = (orders && orders.length ? orders : [
    { id: 836, customer_name: "Demo Customer", delivery_address: "CMC Ring Rd", status: "in_transit", assigned_agent_id: 1 },
    { id: 811, customer_name: "Demo Customer", delivery_address: "Bole Atlas", status: "delivered", assigned_agent_id: 2 },
    { id: 802, customer_name: "Demo Customer", delivery_address: "Saris Market", status: "pending", assigned_agent_id: 3 },
  ]).slice(0, 5);

  function toneFor(status) {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (s === "delivered") return "success";
    if (s === "in_transit") return "info";
    if (s === "picked_up") return "info";
    if (s === "approved") return "info";
    if (s === "pending") return "warning";
    return "neutral";
  }

  async function handleCreateOrder(orderData) {
    const newOrder = await createOrder(orderData, undefined, user?.token);
    setOrders((prev) => [newOrder, ...prev]);
    setAlerts((prev) => [{
      type: "order_created",
      text: `Order #${newOrder.id} created successfully`,
      ts: Date.now(),
    }, ...prev].slice(0, 20));
  }

  return (
    <Layout sidebar={<Sidebar title="OpsPulse Owner" items={sidebarItems} />} topbar={<Topbar title="Owner Dashboard" />}>
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateOrder}
        token={user?.token}
      />
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium"
        >
          + Create Order
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-bold text-accent">Live Orders (last 7 updates)</div>
            <div className={`text-xs ${wsConnected ? "text-green-400" : "text-text-secondary"}`}>{wsConnected ? "Live" : "Offline"}</div>
          </div>
          <Sparkline points={recentSeries.length > 0 ? recentSeries : [5, 7, 6, 9, 11, 8, 10]} />
        </div>
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-0 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-3 text-xl font-bold text-accent">Current Cargo Operations</div>
          <ul className="divide-y divide-bg-primary/60">
            {rows.map((o) => (
              <li key={o.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium truncate">#{o.id} — {o.delivery_address || "Address TBD"}</div>
                  <div className="text-xs text-text-secondary truncate">Agent: {o.assigned_agent_id || "Unassigned"} • {o.customer_name}</div>
                </div>
                <Badge tone={toneFor(o.status)}>{o.status || "unknown"}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6 flex flex-col">
          <div className="text-xl font-bold text-accent mb-4">Daily Revenue</div>
          <BarChart data={revenueBars} />
        </div>
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6 flex flex-col">
          <div className="text-xl font-bold text-accent mb-2">Active Alerts</div>
          <ul className="space-y-3 text-text-secondary max-h-56 overflow-auto pr-2">
            {alerts.length > 0 ? (
              alerts.map((a, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-accent font-medium uppercase text-xs">{a.type}</span>
                  <span className="text-text-secondary">{a.text}</span>
                  <span className="text-xs text-text-secondary/60 ml-auto">
                    {new Date(a.ts).toLocaleTimeString()}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-text-secondary/60 italic">No active alerts</li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}