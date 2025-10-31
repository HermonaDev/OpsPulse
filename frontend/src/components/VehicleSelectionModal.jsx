import React, { useState, useEffect } from "react";
import { fetchVehicles } from "../services/api";

export default function VehicleSelectionModal({ isOpen, onClose, onSelect, token }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      fetchVehicles(undefined, token)
        .then(data => {
          const availableVehicles = data.filter(v => v.status === "available");
          setVehicles(availableVehicles);
          if (availableVehicles.length > 0) {
            setSelectedVehicleId(availableVehicles[0].id.toString());
          }
        })
        .catch(() => {
          setError("Failed to load vehicles");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError("Please select a vehicle");
      return;
    }
    onSelect(parseInt(selectedVehicleId));
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md border border-bg-primary/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Select Vehicle</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Available Vehicles
            </label>
            {loading ? (
              <div className="text-text-secondary">Loading vehicles...</div>
            ) : vehicles.length === 0 ? (
              <div className="text-text-secondary bg-bg-primary/40 rounded-lg p-4">
                No available vehicles. Please contact admin to add vehicles to the fleet.
              </div>
            ) : (
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              >
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.model} - {vehicle.license_plate}
                  </option>
                ))}
              </select>
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
              disabled={loading || vehicles.length === 0}
            >
              {loading ? "Loading..." : "Confirm Selection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

