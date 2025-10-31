import { createContext, useContext, useEffect, useState } from "react";    

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("opspulse_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
  }, []);

  function login({token, role}) {
    const next = { token, role };
    setUser(next);
    localStorage.setItem("opspulse_user", JSON.stringify(next));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("opspulse_user");
  }     

    return (    
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
    return useContext(AuthContext);
}
