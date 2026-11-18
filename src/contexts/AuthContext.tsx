
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";

export interface Usuario {
  username?: string;
  nome?: string;
  name?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      const token = localStorage.getItem("crm_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const user = response.data.usuario ?? response.data.user ?? response.data;

        if (ativo) setUsuario(user);
      } catch {
        localStorage.removeItem("crm_token");

        if (ativo) setUsuario(null);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    verificarSessao();

    const encerrarSessao = () => {
      if (ativo) {
        localStorage.removeItem("crm_token");
        setUsuario(null);
      }
    };

    window.addEventListener("crm:unauthorized", encerrarSessao);

    return () => {
      ativo = false;
      window.removeEventListener("crm:unauthorized", encerrarSessao);
    };
  }, []);

  async function login(username: string, password: string) {
    localStorage.removeItem("crm_token");

    const response = await api.post("/auth/login", {
      username,
      password,
    });

    const token = response.data.accessToken;

    if (!token) {
      throw new Error("O servidor não retornou o token de acesso.");
    }

    localStorage.setItem("crm_token", token);

    try {
      const userResponse = await api.get("/auth/me");

      const user =
        userResponse.data.usuario ??
        userResponse.data.user ??
        userResponse.data;

      setUsuario(user);
    } catch {
      localStorage.removeItem("crm_token");
      setUsuario(null);
      throw new Error("Não foi possível validar sua sessão.");
    }
  }

  function logout() {
    localStorage.removeItem("crm_token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }

  return context;
}
