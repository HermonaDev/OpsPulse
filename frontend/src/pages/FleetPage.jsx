import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { fetchVehicles, createVehicle, approveVehicle, assignAgentToVehicle, fetchUsers } from "../services/api";
import { connectOrdersWS } from "../services/realtime";

export default function FleetPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    vehicle_type: "",
  });

  const sidebarItems = [
    { label: "Dashboard", href: isAdmin ? "/dashboard/admin" : "/dashboard/owner" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [v, u] = await Promise.all([
          fetchVehicles(undefined, user?.token),
          isAdmin ? fetchUsers(undefined, user?.token).then(us => us.filter(u => u.role === "agent")) : Promise.resolve([]),
        ]);
        if (!active) return;
        setVehicles(v);
        setUsers(u);
      } catch (e) {
        console.error("Failed to load fleet data", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.token, isAdmin]);

  // Get user_id from token
  let ownerUserId = null;
  if (user?.token) {
    try {
      const tokenParts = user.token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        ownerUserId = payload.user_id;
      }
    } catch (e) {
      // Failed to decode
    }
  }

  // Create a map of user IDs to user names for display
  const agentMap = {};
  users.forEach(u => agentMap[u.id] = u.name);

  useEffect(() => {
    if (!user?.token) return;
    const ws = connectOrdersWS(undefined, (msg) => {
      if (msg.event === "vehicle_registered" || msg.event === "vehicle_approved") {
        fetchVehicles(undefined, user?.token).then(setVehicles).catch(() => {});
      }
    });
    return () => ws.close();
  }, [user?.token]);

  async function handleRegisterVehicle(e) {
    e.preventDefault();
    try {
      await createVehicle(formData, undefined, user?.token);
      setShowRegisterModal(false);
      setFormData({ license_plate: "", model: "", vehicle_type: "" });
      const updated = await fetchVehicles(undefined, user?.token);
      setVehicles(updated);
    } catch (err) {
      alert(err.message || "Failed to register vehicle");
    }
  }

  async function handleApproveVehicle(vehicleId, status) {
    try {
      await approveVehicle(vehicleId, status, undefined, user?.token);
      setShowApprovalModal(null);
      const updated = await fetchVehicles(undefined, user?.token);
      setVehicles(updated);
    } catch (err) {
      alert(err.message || "Failed to approve vehicle");
    }
  }

  async function handleAssignAgent(vehicleId, agentId) {
    try {
      await assignAgentToVehicle(vehicleId, agentId, undefined, user?.token);
      setShowAssignModal(null);
      const updated = await fetchVehicles(undefined, user?.token);
      setVehicles(updated);
    } catch (err) {
      alert(err.message || "Failed to assign agent");
    }
  }

  function getStatusTone(status) {
    if (status === "available") return "success";
    if (status === "in_use") return "info";
    if (status === "maintenance") return "warning";
    return "neutral";
  }

  function getApprovalTone(status) {
    if (status === "approved") return "success";
    if (status === "pending") return "warning";
    if (status === "rejected") return "danger";
    return "neutral";
  }

  // Filter vehicles based on role
  const pendingVehicles = isAdmin 
    ? vehicles.filter(v => v.approval_status === "pending")
    : vehicles.filter(v => v.approval_status === "pending" && v.owner_id === ownerUserId);
  const approvedVehicles = vehicles.filter(v => v.approval_status === "approved");

  return (
    <Layout 
      sidebar={<Sidebar title={isAdmin ? "OpsPulse" : "OpsPulse Owner"} items={sidebarItems} />} 
      topbar={<Topbar title="Fleet Management" />}
    >
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md border border-bg-primary/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Register Vehicle</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-text-secondary hover:text-text-primary transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">License Plate *</label>
                <input
                  type="text"
                  required
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Model *</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Vehicle Type *</label>
                <select
                  required
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                  className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">Select type</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-4 py-2 bg-bg-primary text-text-secondary rounded-lg hover:bg-bg-primary/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md border border-bg-primary/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Review Vehicle</h2>
              <button
                onClick={() => setShowApprovalModal(null)}
                className="text-text-secondary hover:text-text-primary transition"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 text-sm text-text-secondary">
              <div className="mb-2"><strong>Plate:</strong> {showApprovalModal.license_plate}</div>
              <div className="mb-2"><strong>Model:</strong> {showApprovalModal.model}</div>
              <div className="mb-2"><strong>Type:</strong> {showApprovalModal.vehicle_type}</div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="flex-1 px-4 py-2 bg-bg-primary text-text-secondary rounded-lg hover:bg-bg-primary/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveVehicle(showApprovalModal.id, "rejected")}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveVehicle(showApprovalModal.id, "approved")}
                className="flex-1 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md border border-bg-primary/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Assign Agent</h2>
              <button
                onClick={() => setShowAssignModal(null)}
                className="text-text-secondary hover:text-text-primary transition"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 text-sm text-text-secondary">
              <div className="mb-2"><strong>Vehicle:</strong> {showAssignModal.license_plate} - {showAssignModal.model}</div>
            </div>
            <select
              value={showAssignModal.assigned_agent_id || ""}
              onChange={(e) => {
                if (e.target.value) {
                  handleAssignAgent(showAssignModal.id, parseInt(e.target.value));
                }
              }}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent mb-4"
            >
              <option value="">Select agent...</option>
              {users.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} {agent.phone ? `(${agent.phone})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAssignModal(null)}
              className="w-full px-4 py-2 bg-bg-primary text-text-secondary rounded-lg hover:bg-bg-primary/80 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {!isAdmin && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-accent">Your Fleet Vehicles</h2>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-accent text-bg-primary rounded-lg text-sm font-medium hover:bg-accent-hover transition"
            >
              Register New Vehicle
            </button>
          </div>
        )}

        {pendingVehicles.length > 0 && (
          <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-accent">
                {isAdmin ? "Pending Approvals" : "Your Pending Vehicles"}
              </div>
              <Badge tone="warning">{pendingVehicles.length} pending</Badge>
            </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-text-secondary/80 border-b border-bg-primary/60">
                    <th className="px-5 py-3">Plate</th>
                <th className="px-5 py-3">Model</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
                  {pendingVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-bg-primary/60 hover:bg-bg-primary/40 transition">
                      <td className="px-5 py-3 text-text-primary">{vehicle.license_plate}</td>
                  <td className="px-5 py-3 text-text-primary">{vehicle.model}</td>
                      <td className="px-5 py-3 text-text-secondary">{vehicle.vehicle_type}</td>
                  <td className="px-5 py-3">
                        <button
                          onClick={() => setShowApprovalModal(vehicle)}
                          className="px-3 py-1 rounded bg-accent text-bg-primary text-xs"
                        >
                          Review
                        </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>
        )}

        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
          <div className="text-xl font-bold text-accent mb-4">
            {isAdmin ? "All Fleet Vehicles" : "Your Approved Vehicles"}
          </div>
          {loading ? (
            <div className="text-text-secondary">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-text-secondary/80 border-b border-bg-primary/60">
                    <th className="px-5 py-3">Plate</th>
                    <th className="px-5 py-3">Model</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Approval</th>
                    <th className="px-5 py-3">Assigned Agent</th>
                    {isAdmin && <th className="px-5 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {approvedVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-5 py-4 text-text-secondary text-center">
                        No approved vehicles
                      </td>
                    </tr>
                  ) : (
                    approvedVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b border-bg-primary/60 hover:bg-bg-primary/40 transition">
                        <td className="px-5 py-3 text-text-primary">{vehicle.license_plate}</td>
                        <td className="px-5 py-3 text-text-primary">{vehicle.model}</td>
                        <td className="px-5 py-3 text-text-secondary">{vehicle.vehicle_type}</td>
                        <td className="px-5 py-3">
                          <Badge tone={getStatusTone(vehicle.status)}>{vehicle.status}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={getApprovalTone(vehicle.approval_status)}>{vehicle.approval_status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {vehicle.assigned_agent_id && agentMap[vehicle.assigned_agent_id] ? agentMap[vehicle.assigned_agent_id] : "—"}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3">
                            <button
                              onClick={() => setShowAssignModal(vehicle)}
                              className="px-3 py-1 rounded bg-accent text-bg-primary text-xs"
                            >
                              Assign Agent
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
