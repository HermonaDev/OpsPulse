import React from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "owner";
  const isAgent = user?.role === "agent";

  const sidebarItems = isAgent ? [
    { label: "Dashboard", href: "/dashboard/agent" },
    { label: "Settings", href: "/settings" },
  ] : [
    { label: "Dashboard", href: isAdmin ? "/dashboard/admin" : "/dashboard/owner" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  function handleLogout() {
    logout();
    navigate("/");
  }

  const sidebarTitle = isAdmin ? "OpsPulse" : isOwner ? "OpsPulse Owner" : "OpsPulse Agent";
  
  return (
    <Layout 
      sidebar={<Sidebar title={sidebarTitle} items={sidebarItems} />} 
      topbar={<Topbar title="Settings" />}
    >
      <div className="space-y-6">
        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
          <div className="text-xl font-bold text-accent mb-4">Account Settings</div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-secondary mb-1">Role</div>
              <div className="text-text-primary font-medium">{user?.role || "Unknown"}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary mb-1">Session Status</div>
              <div className="text-text-primary font-medium">Active</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
          <div className="text-xl font-bold text-accent mb-4">System Settings</div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-secondary mb-2">Preferences</div>
              <div className="text-text-secondary text-sm">
                System preferences and configuration options will be available here.
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
          <div className="text-xl font-bold text-accent mb-4">Actions</div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}

