import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RoleRoute({ allowedRoles, children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <p>Checking user role...</p>;
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/student" replace />;
  }

  return children;
}

export default RoleRoute;