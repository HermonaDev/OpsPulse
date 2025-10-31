import {BrowserRouter, Routes, Route} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AgentMobile from './pages/AgentMobile';
import AgentsPage from './pages/AgentsPage';
import FleetPage from './pages/FleetPage';
import CargoPage from './pages/CargoPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={["admin","owner"]}>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
          </ProtectedRoute>
          } />
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agent"
          element={
            <ProtectedRoute allowedRoles={["agent"]}>
              <AgentMobile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AgentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fleet"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <FleetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cargo"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <CargoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner", "agent"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;