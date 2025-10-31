export async function fetchOrders(baseUrl = "/api", token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/orders/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return await res.json();
}

export async function fetchLocations(baseUrl = "/api", token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/locations/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return await res.json();
}

export async function updateOrderStatus(orderId, status, baseUrl = "/api", token, vehicleId = null) {
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

export async function fetchVehicles(baseUrl = "/api", token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/vehicles/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch vehicles: ${res.status}`);
  return await res.json();
}

export async function fetchUsers(baseUrl = "/api", token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/admin/users/`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  return await res.json();
}

export async function approveUser(userId, newRole, baseUrl = "/api", token) {
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

export async function createOrder(orderData, baseUrl = "/api", token) {
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

export async function approveOrder(orderId, agentId, baseUrl = "/api", token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/orders/${orderId}/approve`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ assigned_agent_id: agentId })
  });
  if (!res.ok) throw new Error(`Failed to approve order ${orderId}: ${res.status}`);
  return await res.json();
}


