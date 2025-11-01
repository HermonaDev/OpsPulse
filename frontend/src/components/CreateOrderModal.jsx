import React, { useState } from "react";
import { geocodeAddress } from "../services/geocoding";

export default function CreateOrderModal({ isOpen, onClose, onCreate, token }) {
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setGeocoding(true);

    try {
      // Geocode delivery address
      let deliveryCoords = null;
      if (deliveryAddress.trim()) {
        deliveryCoords = await geocodeAddress(deliveryAddress);
        if (!deliveryCoords) {
          console.warn(`Could not geocode delivery address: ${deliveryAddress}`);
        }
      }

      // Geocode pickup address if provided
      let pickupCoords = null;
      if (pickupAddress.trim()) {
        pickupCoords = await geocodeAddress(pickupAddress);
        if (!pickupCoords) {
          console.warn(`Could not geocode pickup address: ${pickupAddress}`);
        }
      }

      const orderData = {
        customer_name: customerName,
        delivery_address: deliveryAddress,
        ...(deliveryCoords && {
          delivery_latitude: deliveryCoords.latitude,
          delivery_longitude: deliveryCoords.longitude,
        }),
      };

      // Add pickup data if provided
      if (pickupAddress.trim()) {
        orderData.pickup_address = pickupAddress;
        if (pickupCoords) {
          orderData.pickup_latitude = pickupCoords.latitude;
          orderData.pickup_longitude = pickupCoords.longitude;
        }
      }

      await onCreate(orderData);
      
      // Reset form
      setCustomerName("");
      setDeliveryAddress("");
      setPickupAddress("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
      setGeocoding(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md border border-bg-primary/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Create New Order</h2>
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
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Delivery Address *
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              rows={2}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent resize-none"
              placeholder="e.g., Bole Road, Addis Ababa"
            />
            <div className="text-xs text-text-secondary mt-1">
              Address will be automatically geocoded for map display
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Pickup Address <span className="text-xs">(Optional)</span>
            </label>
            <textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-primary/60 rounded-lg text-text-primary focus:outline-none focus:border-accent resize-none"
              placeholder="e.g., Warehouse, Addis Ababa"
            />
          </div>

          {geocoding && (
            <div className="text-xs text-accent flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Geocoding addresses...
            </div>
          )}

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
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

