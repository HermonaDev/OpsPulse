import { Navigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();

    if (!user)
        return <Navigate to="/" />;

    // Block pending users from accessing dashboards
    if (user.role && (user.role.includes("pending") || user.role === "rejected")) {
        return <Navigate to="/" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
    return children;
    }
