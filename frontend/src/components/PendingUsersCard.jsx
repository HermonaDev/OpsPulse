import React from "react";
import Badge from "./Badge";
import { approveUser } from "../services/api";

export default function PendingUsersCard({ users = [], token, onApproved }) {
  const pending = users.filter(u => u.role && (u.role.includes("pending") || u.role === "owner_pending" || u.role === "agent_pending"));

  async function handleApprove(user) {
    const targetRole = user.role.includes("owner") ? "owner" : "agent";
    try {
      await approveUser(user.id, targetRole, undefined, token);
      onApproved?.();
    } catch (e) {
      // error handled silently or could show toast
    }
  }

  async function handleReject(user) {
    try {
      await approveUser(user.id, "rejected", undefined, token);
      onApproved?.();
    } catch (e) {
      // error handled silently
    }
  }

  if (pending.length === 0) {
    return (
      <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-5">
        <div className="text-xl font-bold text-accent mb-3">Verification Requests</div>
        <div className="text-sm text-text-secondary">No pending verification requests</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary/90 rounded-2xl border border-accent/30 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xl font-bold text-accent">Verification Requests</div>
        <Badge tone="warning">{pending.length} pending</Badge>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {pending.map((u) => (
          <div key={u.id} className="bg-bg-primary/40 rounded-lg p-4 border border-bg-primary/60">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-medium truncate">{u.name}</div>
                <div className="text-xs text-text-secondary truncate">{u.email}</div>
                <div className="text-xs text-text-secondary mt-1">Phone: {u.phone || "—"}</div>
                <Badge tone={u.role.includes("owner") ? "info" : "neutral"} className="mt-2">
                  {u.role.includes("owner") ? "Owner Request" : "Agent Request"}
                </Badge>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(u)}
                  className="px-3 py-1.5 rounded-lg bg-accent text-bg-primary text-xs font-semibold hover:bg-accent-hover transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(u)}
                  className="px-3 py-1.5 rounded-lg bg-bg-primary text-text-secondary border border-bg-primary/60 text-xs font-semibold hover:bg-bg-secondary transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

