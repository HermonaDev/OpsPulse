import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { fetchUsers, fetchOrders } from "../services/api";

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // If owner, get agents from their orders
        if (user?.role === "owner") {
          const orders = await fetchOrders(undefined, user?.token);
          if (!active) return;
          // Get unique agent IDs from orders
          const agentIds = [...new Set(orders
            .map(o => o.assigned_agent_id)
            .filter(id => id != null)
          )];
          
          if (agentIds.length > 0) {
            const users = await fetchUsers(undefined, user?.token);
            // Filter to show only agents related to owner's orders
            const agentUsers = users.filter(u => 
              u.role === "agent" && agentIds.includes(u.id)
            );
            setAgents(agentUsers);
          } else {
            setAgents([]);
          }
        } else {
          // Admin sees all agents
          const users = await fetchUsers(undefined, user?.token);
          if (!active) return;
          const agentUsers = users.filter(u => u.role === "agent");
          setAgents(agentUsers);
        }
      } catch (e) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.token, user?.role]);

  const sidebarItems = [
    { label: "Dashboard", href: isAdmin ? "/dashboard/admin" : "/dashboard/owner" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <Layout 
      sidebar={<Sidebar title={isAdmin ? "OpsPulse" : "OpsPulse Owner"} items={sidebarItems} />} 
      topbar={<Topbar title="Agents" />}
    >
      <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
        <div className="text-xl font-bold text-accent mb-4">
          {user?.role === "owner" ? "Agents Assigned to Your Orders" : "Active Agents"}
        </div>
        {loading ? (
          <div className="text-text-secondary">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="text-text-secondary">
            {user?.role === "owner" 
              ? "No agents are currently assigned to your orders" 
              : "No agents found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-text-secondary/80 border-b border-bg-primary/60">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-bg-primary/60 hover:bg-bg-primary/40 transition">
                    <td className="px-5 py-3 text-text-primary">{agent.id}</td>
                    <td className="px-5 py-3 text-text-primary">{agent.name}</td>
                    <td className="px-5 py-3 text-text-secondary">{agent.email}</td>
                    <td className="px-5 py-3 text-text-secondary">{agent.phone || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

