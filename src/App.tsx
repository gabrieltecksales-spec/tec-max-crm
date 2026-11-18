
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pedidos from "./pages/Pedidos";
import NotFound from "./pages/NotFound";
import SectionPlaceholder from "./pages/SectionPlaceholder";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/novo" element={<Clientes />} />
          <Route path="clientes/:id" element={<Clientes />} />
          <Route path="clientes/:id/editar" element={<Clientes />} />

          <Route path="pedidos" element={<Pedidos />} />

          <Route
            path="atendimentos"
            element={
              <SectionPlaceholder
                title="Atendimentos"
                description="Histórico de ligações, e-mails, WhatsApp e atendimentos presenciais."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
