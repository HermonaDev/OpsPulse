import { API_BASE_URL } from "../config";

export async function fetchOrders(baseUrl = API_BASE_URL, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/orders/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return await res.json();
}

export async function fetchLocations(baseUrl = API_BASE_URL, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/locations/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return await res.json();
}

export async function updateOrderStatus(orderId, status, baseUrl = API_BASE_URL, token, vehicleId = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const body = { status };
  if (vehicleId) body.vehicle_id = vehicleId;
  const res = await fetch(`${baseUrl}/orders/${orderId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to update order ${orderId}: ${res.status}`);
  return await res.json();
}

export async function fetchVehicles(baseUrl = API_BASE_URL, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/vehicles/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch vehicles: ${res.status}`);
  return await res.json();
}

export async function createVehicle(vehicleData, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/vehicles/`, {
    method: "POST",
    headers,
    body: JSON.stringify(vehicleData)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create vehicle: ${res.status} - ${errorText}`);
  }
  return await res.json();
}

export async function approveVehicle(vehicleId, approvalStatus, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/vehicles/${vehicleId}/approve`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ approval_status: approvalStatus })
  });
  if (!res.ok) throw new Error(`Failed to approve vehicle ${vehicleId}: ${res.status}`);
  return await res.json();
}

export async function assignAgentToVehicle(vehicleId, agentId, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/vehicles/${vehicleId}/assign-agent`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ assigned_agent_id: agentId })
  });
  if (!res.ok) throw new Error(`Failed to assign agent to vehicle ${vehicleId}: ${res.status}`);
  return await res.json();
}

export async function fetchUsers(baseUrl = API_BASE_URL, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/admin/users/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  return await res.json();
}

export async function fetchAgents(baseUrl = API_BASE_URL, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/agents/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  return await res.json();
}

export async function approveUser(userId, newRole, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role: newRole })
  });
  if (!res.ok) throw new Error(`Failed to approve user ${userId}: ${res.status}`);
  return await res.json();
}

export async function createOrder(orderData, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/orders/`, {
    method: "POST",
    headers,
    body: JSON.stringify(orderData)
  });
  if (!res.ok) throw new Error(`Failed to create order: ${res.status}`);
  return await res.json();
}

export async function approveOrder(orderId, agentId, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const body = { assigned_agent_id: parseInt(agentId) };
  const res = await fetch(`${baseUrl}/orders/${orderId}/approve`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to approve order ${orderId}: ${res.status} - ${errorText}`);
  }
  return await res.json();
}

export async function updateLocation(locationData, baseUrl = API_BASE_URL, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/locations/`, {
    method: "POST",
    headers,
    body: JSON.stringify(locationData)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update location: ${res.status} - ${errorText}`);
  }
  return await res.json();
}

