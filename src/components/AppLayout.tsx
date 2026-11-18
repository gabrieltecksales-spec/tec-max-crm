
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  LayoutDashboard,
  Users,
  ShoppingBag,
  MessagesSquare,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./AppLayout.css";

export default function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const nome =
    usuario?.nome ||
    usuario?.name ||
    usuario?.username ||
    "Usuário";

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Gamepad2 size={25} />
          </div>
          <div>
            <strong>TEC MAX</strong>
            <span>GESTÃO COMERCIAL</span>
          </div>
        </div>

        <div className="sidebar-label">MENU PRINCIPAL</div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <LayoutDashboard size={19} />
            <span>Painel</span>
          </NavLink>

          <NavLink
            to="/clientes"
            end
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <Users size={19} />
            <span>Clientes</span>
          </NavLink>

          <NavLink
            to="/clientes/novo"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <UserPlus size={19} />
            <span>Novo cliente</span>
          </NavLink>

          <NavLink
            to="/pedidos"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <ShoppingBag size={19} />
            <span>Pedidos</span>
          </NavLink>

          <NavLink
            to="/atendimentos"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <MessagesSquare size={19} />
            <span>Atendimentos</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-company">
            <Gamepad2 size={17} />
            <span>TEC MAX STORE</span>
          </div>

          <button className="logout-button" onClick={sair}>
            <LogOut size={18} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="main-header">
          <div>
            <span className="header-caption">TEC MAX / ADMINISTRAÇÃO</span>
            <h1>Gestão comercial</h1>
          </div>

          <div className="header-user">
            <div className="user-avatar">
              {String(nome).charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{String(nome)}</strong>
              <span>Administrador</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
