import React from "react";

export default function KpiCard({ label, value, sublabel, trend }) {
  return (
    <div className="relative rounded-2xl p-5 bg-gradient-to-b from-bg-secondary/90 to-bg-secondary shadow-lg border border-bg-primary/60 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          "radial-gradient(600px 120px at 20% -10%, rgba(146,211,10,0.18), transparent 60%), radial-gradient(400px 100px at 120% -30%, rgba(146,211,10,0.12), transparent 60%)"
      }} />
      <div className="relative">
        <div className="text-sm text-text-secondary">{label}</div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary">{value}</div>
        <div className="mt-2 text-xs text-text-secondary">{sublabel}</div>
        {trend && (
          <div className="mt-3 text-xs">
            <span className={trend.up ? "text-green-400" : "text-red-400"}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </span>
            <span className="text-text-secondary"> vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}


