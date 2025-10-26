import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-secondary text-text-secondary flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-bg-primary">
          <span className="text-2xl font-bold text-accent">OpsPulse</span>
        </div>
        <nav className="flex flex-col gap-2 mt-8 px-6">
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Dashboard</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Orders</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Agents</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Settings</a>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* This is where we’ll add cards and rest of dashboard next! */}
        <div className="text-text-primary text-3xl font-semibold mb-8">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="bg-bg-secondary rounded-xl shadow flex flex-col items-start p-6">
              <span className="text-lg text-text-secondary mb-2">Orders</span>
              <span className="text-3xl text-accent font-bold">38</span>
              <span className="mt-2 text-sm text-text-secondary">Active</span>
            </div>
            <div className="bg-bg-secondary rounded-xl shadow flex flex-col items-start p-6">
              <span className="text-lg text-text-secondary mb-2">Agents</span>
              <span className="text-3xl text-accent font-bold">12</span>
              <span className="mt-2 text-sm text-text-secondary">Online</span>
            </div>
            <div className="bg-bg-secondary rounded-xl shadow flex flex-col items-start p-6">
              <span className="text-lg text-text-secondary mb-2">Completed</span>
              <span className="text-3xl text-accent font-bold">29</span>
              <span className="mt-2 text-sm text-text-secondary">This Month</span>
            </div>
          </div>


          <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col items-start mb-8">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="w-full h-64 rounded-lg border-2 border-accent overflow-hidden">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=38.7457%2C8.9406%2C38.7707%2C8.9906&amp;layer=mapnik"
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="OpenStreetMap"
                ></iframe>
              </div>
              {/* Placeholder for the map */}
            </div>
          </div>

          <div className="bg-bg-secondary rounded-xl shadow mb-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-accent">Recent Orders</span>
              <button className="bg-accent text-bg-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition">
                View All
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-bg-primary">
                  <th className="py-2 text-text-secondary text-sm">Order ID</th>
                  <th className="py-2 text-text-secondary text-sm">Agent</th>
                  <th className="py-2 text-text-secondary text-sm">Status</th>
                  <th className="py-2 text-text-secondary text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-bg-primary hover:bg-bg-primary/50 transition">
                  <td className="py-3">#ORD836</td>
                  <td className="py-3">Amanuel Solomon</td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-1 rounded text-xs bg-accent text-bg-primary font-medium">
                      In Transit
                    </span>
                  </td>
                  <td className="py-3">2025-10-25</td>
                  <td className="py-3 flex gap-2">
                    <button className="px-2 py-1 bg-accent text-bg-primary rounded text-xs">Reassign</button>
                    <button className="px-2 py-1 bg-bg-primary text-accent border border-accent rounded text-xs">Delay</button>
                    <button className="px-2 py-1 bg-accent text-bg-primary rounded text-xs">Contact</button>
                  </td>
                </tr>
                <tr className="border-b border-bg-primary hover:bg-bg-primary/50 transition">
                  <td className="py-3">#ORD811</td>
                  <td className="py-3">Hermona Daniel</td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-1 rounded text-xs bg-accent text-bg-primary font-medium">
                      Delivered
                    </span>
                  </td>
                  <td className="py-3">2025-10-22</td>
                  <td className="py-3 flex gap-2">
                    <button className="px-2 py-1 bg-accent text-bg-primary rounded text-xs">Reassign</button>
                    <button className="px-2 py-1 bg-bg-primary text-accent border border-accent rounded text-xs">Delay</button>
                    <button className="px-2 py-1 bg-accent text-bg-primary rounded text-xs">Contact</button>
                  </td>
                </tr>
                <tr className="border-b border-bg-primary hover:bg-bg-primary/50 transition">
                  <td className="py-3">#ORD802</td>
                  <td className="py-3">Kidus Misganaw</td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-1 rounded text-xs bg-accent text-bg-primary font-medium">
                      Pending
                    </span>
                  </td>
                  <td className="py-3">2025-10-19</td>
                  <td className="py-3 flex gap-2">
                    <button className="px-2 py-1 bg-accent text-bg-primary rounded text-xs">Reassign</button>
                    <button className="px-2 py-1 bg-bg-primary text-accent border border-accent rounded text-xs">Delay</button>
                    <button className="px-2 py-1 bg-accent text-bg-primary rounded text-xs">Contact</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-bg-secondary rounded-xl shadow p-6 mt-8">
            <div className="text-xl font-bold text-accent mb-4">Notifications</div>
            <ul className="space-y-3">
              <li className="text-text-secondary"><span className="text-accent font-medium">ALERT</span>: Order #ORD811 is delayed by 1 hour</li>
              <li className="text-text-secondary"><span className="text-accent font-medium">INFO</span>: New order assigned to agent Hermona Daniel</li>
              <li className="text-text-secondary"><span className="text-accent font-medium">ALERT</span>: Agent Kidus Misganaw not responding</li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}