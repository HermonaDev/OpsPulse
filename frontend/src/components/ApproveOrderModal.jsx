import React, { useState, useEffect } from "react";
import { fetchUsers } from "../services/api";

export default function ApproveOrderModal({ isOpen, onClose, onApprove, order, token, locations = [] }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && token) {
      fetchUsers(undefined, token)
        .then(users => {
          const agentUsers = users.filter(u => u.role === "agent");
          setAgents(agentUsers);
          if (agentUsers.length > 0) {
            setSelectedAgentId(agentUsers[0].id.toString());
          }
        })
        .catch(() => {
          setError("Failed to load agents");
        });
    }
  }, [isOpen, token]);

  if (!isOpen || !order) return null;

  const isReassignment = order.status && order.status !== "pending";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAgentId) {
      setError("Please select an agent");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onApprove(order.id, parseInt(selectedAgentId));
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isReassignment ? 'reassign' : 'approve'} order`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md border border-bg-primary/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">
            {isReassignment ? `Reassign Order #${order.id}` : `Approve Order #${order.id}`}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 text-sm text-text-secondary">
          <div className="mb-2"><strong>Customer:</strong> {order.customer_name}</div>
          <div className="mb-2"><strong>Address:</strong> {order.delivery_address}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Assign Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              {agents.length === 0 ? (
                <option value="">No agents available</option>
              ) : (
                agents.map(agent => {
                  const agentLocation = locations.find(loc => loc.agent_id === agent.id);
                  const hasLocation = !!agentLocation;
                  return (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.phone ? `(${agent.phone})` : ""} {hasLocation ? "📍" : ""}
                    </option>
                  );
                })
              )}
            </select>
            {locations.length > 0 && (
              <div className="text-xs text-text-secondary mt-1">
                💡 Agents with 📍 have location data available for proximity assignment
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-bg-primary text-text-secondary rounded-lg hover:bg-bg-primary/80 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover transition font-medium"
              disabled={loading || agents.length === 0}
            >
              {loading ? (isReassignment ? "Reassigning..." : "Approving...") : (isReassignment ? "Reassign" : "Approve & Assign")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

