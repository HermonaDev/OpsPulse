import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="p-8">
      <div className="text-3xl text-blue-700">Admin Dashboard</div>
      <button
        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}