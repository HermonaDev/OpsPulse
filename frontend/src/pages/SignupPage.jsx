import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("agent");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      // Create all users as pending - requires admin verification
      const submitRole = role === "owner" ? "owner_pending" : "agent_pending";
      const res = await fetch("/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: submitRole, phone })
      });
      if (!res.ok) throw new Error("Signup failed");
      setStatus("Your request has been submitted. An admin will verify your account before you can log in.");
    } catch (e) {
      setStatus("Could not create account. Email may be taken or server unreachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-3xl font-extrabold tracking-tight text-text-primary">
            Create account <span className="text-accent">•</span>
          </div>
          <div className="text-sm text-text-secondary mt-1">Agent signup; Owners require admin verification</div>
        </div>

        <form onSubmit={handleSignup} className="relative rounded-2xl p-6 bg-gradient-to-b from-bg-secondary/80 to-bg-secondary border border-bg-primary/60 shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(800px 180px at 20% -20%, rgba(146,211,10,0.16), transparent 60%)"
          }} />
          <div className="relative">
            <label className="text-sm text-text-secondary">Full name</label>
            <input value={name} onChange={e=>setName(e.target.value)} required className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary" />
            <label className="text-sm text-text-secondary mt-4 block">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary" />
            <label className="text-sm text-text-secondary mt-4 block">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary" />
            <label className="text-sm text-text-secondary mt-4 block">Phone {role === "agent" && <span className="text-accent">*</span>}</label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required={role === "agent"} className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary" />
            <label className="text-sm text-text-secondary mt-4 block">Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} className="mt-2 w-full p-3 rounded-lg bg-bg-primary border border-bg-primary/60 text-text-primary">
              <option value="agent">Agent</option>
              <option value="owner">Owner (requires admin verification)</option>
            </select>
            {status && <div className="mt-3 text-xs text-text-secondary">{status}</div>}
            <button disabled={loading} type="submit" className="mt-4 w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary font-semibold transition">
              {loading ? "Creating..." : "Create account"}
            </button>
            <button type="button" onClick={()=>navigate("/")} className="mt-2 w-full py-3 rounded-lg bg-bg-primary text-text-primary border border-bg-primary/60">
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


