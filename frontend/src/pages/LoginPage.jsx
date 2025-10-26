import {useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
    const [role, setRole] = useState("admin");

    function handleLogin(e) {
        e.preventDefault();
        login({ token: "demo-token", role });
        if (role === "admin") navigate("/dashboard/admin");
        else if (role === "owner") navigate("/dashboard/owner");
        else if (role === "agent") navigate("/dashboard/agent");
    }

return (
    <div className="p-8 flex flex-col gap-4 max-w-md mx-auto">
      <label className="text-lg font-bold">Select role (demo):</label>
      <select value={role} onChange={e => setRole(e.target.value)} className="mb-4 p-2 border rounded">
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
        <option value="agent">Agent</option>
      </select>
      <button className="py-2 px-4 bg-accent text-white rounded" onClick={handleLogin}>
        Login as {role}
      </button>
    </div>
  );
}