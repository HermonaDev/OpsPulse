import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar({ title = "OpsPulse", items = [] }) {
  return (
    <aside className="hidden md:flex w-72 bg-bg-secondary/80 backdrop-blur border-r border-bg-secondary/60 text-text-secondary flex-col sticky top-0 h-screen">
      <div className="h-20 flex items-center justify-center border-b border-bg-secondary/60">
        <span className="text-2xl font-extrabold tracking-tight">
          <span className="text-text-primary">{title}</span>
          <span className="text-accent">•</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href || "#"}
            className="group flex items-center gap-3 px-3 py-2 rounded-lg transition bg-transparent hover:bg-bg-primary/70 text-text-secondary hover:text-text-primary border border-transparent hover:border-bg-primary/60"
          >
            <span className="text-accent">{item.icon || "•"}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-bg-secondary/60">
        <div className="text-xs text-text-secondary/80">© {new Date().getFullYear()} OpsPulse</div>
      </div>
    </aside>
  );
}


