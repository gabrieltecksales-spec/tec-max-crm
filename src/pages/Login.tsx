
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Gamepad2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import CodeRain from "../components/CodeRain";
import "../App.css";

export default function Login() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const destino = location.state?.from?.pathname || "/";

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate(destino, { replace: true });
    } catch (err) {
      const responseError = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
        message?: string;
      };

      if (responseError.response?.status === 400) {
        setError(
          responseError.response.data?.message ||
          "Usuário ou senha incorretos."
        );
      } else {
        setError(
          responseError.response?.data?.message ||
          responseError.message ||
          "Não foi possível realizar o login."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (usuario) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <main className="login-page">
      <CodeRain />
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">
        <a href="/login" className="brand">
          <span className="brand-symbol">
            <Gamepad2 size={23} />
          </span>
          <span>TEC <span className="brand-light">MAX</span></span>
        </a>

        <span className="system-status">
          GESTÃO DE CLIENTES E VENDAS
        </span>
      </header>

      <section className="login-layout">
        <div className="presentation">
          <span className="eyebrow">TECNOLOGIA E ACESSÓRIOS GAMER</span>

          <h1>
            Seu negócio.
            <br />
            Seus clientes.
            <br />
            <span>Seu próximo nível.</span>
          </h1>

          <p className="presentation-description">
            Organize clientes, acompanhe pedidos e mantenha
            todo o histórico comercial da TEC MAX em um só lugar.
          </p>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">01</span>
              <div>
                <strong>Gestão de clientes</strong>
                <span>Cadastros, contatos e relacionamento.</span>
              </div>
            </div>

            <div className="feature">
              <span className="feature-icon">02</span>
              <div>
                <strong>Controle de pedidos</strong>
                <span>Produtos, valores e acompanhamento.</span>
              </div>
            </div>

            <div className="feature">
              <span className="feature-icon">03</span>
              <div>
                <strong>Histórico comercial</strong>
                <span>Registro de todos os atendimentos.</span>
              </div>
            </div>
          </div>

          <div className="presentation-footer">
            <span>TECNOLOGIA</span>
            <span className="footer-line" />
            <span>ORGANIZAÇÃO</span>
            <span className="footer-line" />
            <span>RESULTADOS</span>
          </div>
        </div>

        <section className="login-card">
          <div className="card-top">
            <div className="login-icon">
              <Gamepad2 size={23} />
            </div>
            <span className="eyebrow">ACESSO ADMINISTRATIVO</span>
          </div>

          <h2>Entrar na TEC MAX</h2>
          <p className="card-description">
            Informe suas credenciais para acessar o sistema.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="username">Usuário</label>
            <div className="input-wrapper">
              <span className="input-icon">◎</span>
              <input
                id="username"
                type="text"
                placeholder="Seu usuário"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <span className="input-icon">◇</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Verificando acesso..." : "Acessar sistema"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="security-note">
            <span>◇</span>
            <span>Acesso restrito à equipe da TEC MAX.</span>
          </div>

          <div className="card-bottom">
            <span>TEC MAX</span>
            <span>GESTÃO COMERCIAL</span>
          </div>
        </section>
      </section>

      <footer className="page-footer">
        <span>TEC MAX © 2026</span>
        <span>GESTÃO DE CLIENTES E PEDIDOS</span>
      </footer>
    </main>
  );
}
