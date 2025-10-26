import React from "react";

// Demo/mock data
const cargoOrders = [
  {
    id: "EF-0097001346",
    distance: "28km",
    late: "35 minutes late",
    from: "12 Bridge Rd, Ultimo NSW 2007",
    to: "25 Sussex St, Sydney NSW 2000",
    eta: "1h 45m",
    driver: { name: "Ahmad Prasetyo", phone: "+62-813-9874-1123", hours: "3h 25m", rest: "45m" },
    vehicle: {
      model: "Hino Ranger FL8J",
      status: "In Transit",
      image: 
        "https://hinobalintawak.com.ph/wp-content/uploads/2020/09/FL8JW7A-Euro-4.png"},
  },
  // Add more orders if you want...
];

function CargoDetailCard({ cargo }) {
  return (
    <div className="bg-bg-secondary rounded-xl shadow px-8 py-6 grid grid-cols-2 min-h-36 mb-6 items-center gap-x-10">
      {/* LEFT COLUMN */}
      <div>
        <div className="font-bold text-lg text-text-primary mb-1">{cargo.driver.name}</div>
        <div className="text-xs text-text-secondary mb-4">{cargo.driver.phone}</div>
        <div className="mt-8 mb-3">
          <div className="text-xs text-text-secondary">From:</div>
          <div className="font-semibold text-text-primary">{cargo.from}</div>
        </div>
        <div>
          <div className="text-xs text-text-secondary">To:</div>
          <div className="font-semibold text-text-primary">{cargo.to}</div>
        </div>
      </div>
      {/* RIGHT COLUMN */}
      <div className="flex flex-col h-full justify-center items-start">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-bg-primary text-xs text-text-secondary px-2 py-1 rounded">{cargo.id}</span>
          <span className="ml-1 text-orange-400">🚚</span>
          <span className="font-bold text-base text-text-primary">{cargo.vehicle.model}</span>
          <span className="ml-2 text-xs font-medium bg-accent text-bg-primary rounded px-2 py-1">{cargo.vehicle.status}</span>
        </div>
        <div className="flex items-center gap-10 mt-2 mb-7">
          <div>
            <span className="text-text-secondary text-xs">ETA:</span>
            <span className="font-bold text-base text-text-primary ml-2">{cargo.eta}</span>
          </div>
          <div>
            <span className="text-text-secondary text-xs">Distance:</span>
            <span className="font-bold text-base text-text-primary ml-2">{cargo.distance}</span>
          </div>
          <span className={cargo.late ? "text-red-500 font-bold ml-8" : "text-green-500 font-bold ml-8"}>
            {cargo.late ? cargo.late : "On time"}
          </span>
        </div>
        <div className="flex justify-end w-full">
          <img src={cargo.vehicle.image} alt={cargo.vehicle.model} className="h-24 object-contain" />
        </div>
      </div>
    </div>
  );
}


export default function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-secondary text-text-secondary flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-bg-primary">
          <span className="text-2xl font-bold text-accent">OpsPulse Owner</span>
        </div>
        <nav className="flex flex-col gap-2 mt-8 px-6">
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Dashboard</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Fleet</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Orders</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Reports</a>
          <a href="#" className="py-2 rounded hover:bg-accent hover:text-bg-primary transition">Settings</a>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="bg-bg-secondary rounded-xl shadow flex flex-col items-start p-6">
            <span className="text-lg text-text-secondary mb-2">Revenue</span>
            <span className="text-3xl text-accent font-bold">ETB 41,200</span>
            <span className="mt-2 text-sm text-text-secondary">Monthly</span>
          </div>
          <div className="bg-bg-secondary rounded-xl shadow flex flex-col items-start p-6">
            <span className="text-lg text-text-secondary mb-2">Delivery Success</span>
            <span className="text-3xl text-accent font-bold">92%</span>
            <span className="mt-2 text-sm text-text-secondary">Last week</span>
          </div>
          <div className="bg-bg-secondary rounded-xl shadow flex flex-col items-start p-6">
            <span className="text-lg text-text-secondary mb-2">Orders Pending</span>
            <span className="text-3xl text-accent font-bold">7</span>
            <span className="mt-2 text-sm text-text-secondary">Current</span>
          </div>
        </div>
        {/* Side-by-side chart and cargo list */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col">
            <div className="text-xl font-bold text-accent mb-2">Delivery Times (Last week)</div>
            {/* Chart placeholder */}
            <div className="h-44 bg-bg-primary rounded-md flex items-center justify-center text-text-secondary">
              <span>[Line chart goes here]</span>
            </div>
          </div>
          <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col">
            <div className="text-xl font-bold text-accent mb-4">Current Cargo Operations</div>
            {cargoOrders.map((cargo, idx) => (
              <CargoDetailCard key={idx} cargo={cargo} />
            ))}
          </div>
        </div>
        {/* Bar chart & Active Alerts clean row */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col">
            <div className="text-xl font-bold text-accent mb-2">Daily Revenue</div>
            <div className="h-32 bg-bg-primary rounded-md flex items-center justify-center text-text-secondary">
              <span>[Bar chart goes here]</span>
            </div>
          </div>
          <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col">
            <div className="text-xl font-bold text-accent mb-2">Active Alerts</div>
            <ul className="space-y-3 text-text-secondary">
              <li><span className="text-accent font-medium">ALERT</span>: Agent Kidus Misganaw not responding</li>
              <li><span className="text-accent font-medium">DELAY</span>: Order #ORD802 delayed by 2hrs</li>
              <li><span className="text-accent font-medium">OPS</span>: Manager note: Focus on north fleet</li>
            </ul>
          </div>
        </div>
        // The rest of the dashboard stays the same, you just use this version for your cargo cards:
<div className="grid grid-cols-2 gap-8 mb-8">
  <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col">
    <div className="text-xl font-bold text-accent mb-2">Delivery Times (Last week)</div>
    <div className="h-44 bg-bg-primary rounded-md flex items-center justify-center text-text-secondary">
      <span>[Line chart goes here]</span>
    </div>
  </div>
  <div className="bg-bg-secondary rounded-xl shadow p-6 flex flex-col">
    <div className="text-xl font-bold text-accent mb-4">Current Cargo Operations</div>
    {cargoOrders.map((cargo, idx) => (
      <CargoDetailCard key={idx} cargo={cargo} />
    ))}
  </div>
</div>
      </main>
    </div>
  );
}