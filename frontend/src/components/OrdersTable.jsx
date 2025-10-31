import React, { useState } from "react";
import Badge from "./Badge";

export default function OrdersTable({ rows = [], onDelay, onReassign, onContact }) {
  const [showPhone, setShowPhone] = useState({});
  return (
    <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-text-secondary/80 border-b border-bg-primary/60">
              <th className="px-5 py-3">Order ID</th>
              <th className="px-5 py-3">Agent</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-bg-primary/60 hover:bg-bg-primary/40 transition">
                <td className="px-5 py-4 font-medium text-text-primary">{r.id}</td>
                <td className="px-5 py-4 text-text-secondary">{r.agent}</td>
                <td className="px-5 py-4">
                  <Badge tone={r.statusTone}>{r.status}</Badge>
                </td>
                <td className="px-5 py-4 text-text-secondary">{r.date}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={()=>onReassign?.(r)} className="px-3 py-1 rounded bg-accent text-bg-primary text-xs">Reassign</button>
                    <button onClick={()=>onDelay?.(r)} className="px-3 py-1 rounded bg-bg-primary text-accent border border-accent text-xs">Delay</button>
                    <button onClick={()=>{
                      if (r.agentPhone) {
                        setShowPhone(prev => ({...prev, [r.id]: !prev[r.id]}));
                      } else {
                        onContact?.(r);
                      }
                    }} className="px-3 py-1 rounded bg-accent text-bg-primary text-xs">
                      {r.agentPhone && showPhone[r.id] ? r.agentPhone : "Contact"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


