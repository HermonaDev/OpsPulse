import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title = "Dashboard", actions }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-bg-primary/80 to-transparent backdrop-blur px-6 sm:px-8 lg:px-10 py-4 border-b border-bg-secondary/60">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {title}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Welcome back{user?.role ? `, ${user.role}` : ""}</div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <input
            placeholder="Search orders, agents, fleet..."
            className="px-3 py-2 rounded-lg bg-bg-secondary/70 border border-bg-primary/60 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {actions}
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-bg-secondary hover:bg-bg-secondary/70 border border-bg-primary/60 text-text-primary text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}


