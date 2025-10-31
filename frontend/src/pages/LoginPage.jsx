import {useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, decodeJwtPayload } from "../services/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        try {
          const { access_token } = await loginRequest({ email, password });
          const payload = decodeJwtPayload(access_token);
          const role = payload?.role || "owner";
          login({ token: access_token, role });
          if (role === "admin") navigate("/dashboard/admin");
          else if (role === "owner") navigate("/dashboard/owner");
          else if (role === "agent") navigate("/dashboard/agent");
          else navigate("/dashboard/owner");
        } catch (err) {
          setError("Invalid credentials or server unreachable");
        }
    }

return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-3xl font-extrabold tracking-tight text-text-primary">
            OpsPulse<span className="text-accent">•</span>
          </div>
          <div className="text-sm text-text-secondary mt-1">Logistics Operations Platform</div>
        </div>

        <form onSubmit={handleLogin} className="relative rounded-2xl p-6 bg-gradient-to-b from-bg-secondary/80 to-bg-secondary border border-bg-primary/60 shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(800px 180px at 20% -20%, rgba(146,211,10,0.16), transparent 60%)"
          }} />
          <div className="relative">
            <label className="text-sm text-text-secondary">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary" />
            <label className="text-sm text-text-secondary mt-4 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary" />
            {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
            <button type="submit" className="mt-4 w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary font-semibold transition">
              Sign in
            </button>
            <button type="button" onClick={()=>navigate('/signup')} className="mt-2 w-full py-3 rounded-lg bg-bg-primary text-text-primary border border-bg-primary/60">
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}