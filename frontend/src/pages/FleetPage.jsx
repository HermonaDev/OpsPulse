import React from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";

export default function FleetPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const sidebarItems = [
    { label: "Dashboard", href: isAdmin ? "/dashboard/admin" : "/dashboard/owner" },
    { label: "Orders", href: "/orders" },
    { label: "Agents", href: "/agents" },
    { label: "Fleet", href: "/fleet" },
    { label: "Cargo", href: "/cargo" },
    { label: "Settings", href: "/settings" },
  ];

  // Mock fleet data
  const fleetVehicles = [
    { id: 1, model: "Hino Ranger FL8J", plate: "ET-12345", status: "In Transit", driver: "Ahmad Prasetyo", location: "Addis Ababa" },
    { id: 2, model: "Isuzu NPR", plate: "ET-67890", status: "Available", driver: "Unassigned", location: "Depot" },
    { id: 3, model: "Mercedes Actros", plate: "ET-11111", status: "Maintenance", driver: "N/A", location: "Service Center" },
  ];

  return (
    <Layout 
      sidebar={<Sidebar title={isAdmin ? "OpsPulse" : "OpsPulse Owner"} items={sidebarItems} />} 
      topbar={<Topbar title="Fleet Management" />}
    >
      <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-6">
        <div className="text-xl font-bold text-accent mb-4">
          {user?.role === "owner" ? "Your Vehicle Fleet" : "Vehicle Fleet"}
        </div>
        {user?.role === "owner" && (
          <div className="text-sm text-text-secondary mb-4">
            Showing vehicles assigned to your orders
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-text-secondary/80 border-b border-bg-primary/60">
                <th className="px-5 py-3">Vehicle ID</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">License Plate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {fleetVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-bg-primary/60 hover:bg-bg-primary/40 transition">
                  <td className="px-5 py-3 text-text-primary">#{vehicle.id}</td>
                  <td className="px-5 py-3 text-text-primary">{vehicle.model}</td>
                  <td className="px-5 py-3 text-text-secondary">{vehicle.plate}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      vehicle.status === "In Transit" ? "bg-blue-500/20 text-blue-400" :
                      vehicle.status === "Available" ? "bg-green-500/20 text-green-400" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{vehicle.driver}</td>
                  <td className="px-5 py-3 text-text-secondary">{vehicle.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

