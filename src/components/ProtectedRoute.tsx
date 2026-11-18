
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="session-loading">Verificando sessão...</div>;
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
