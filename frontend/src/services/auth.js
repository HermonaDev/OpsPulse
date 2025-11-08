import { API_BASE_URL } from "../config";

export async function loginRequest({ baseUrl = API_BASE_URL, email, password }) {
  const res = await fetch(`${baseUrl}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  // Try to parse response (works for both success and error)
  let data;
  try {
    data = await res.json();
  } catch {
    // If response is not JSON, throw generic error
    if (!res.ok) {
      throw new Error(`Login failed: ${res.status}`);
    }
    throw new Error("Invalid response from server");
  }
  
  if (!res.ok) {
    // Extract error message from response
    const errorMessage = data.detail || data.message || `Login failed: ${res.status}`;
    throw new Error(errorMessage);
  }
  
  return data;
}

export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}


