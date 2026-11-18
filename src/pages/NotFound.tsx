
import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <SearchX size={52} />

        <span>ERRO 404</span>

        <h1>Página não encontrada</h1>

        <p>
          O endereço acessado não corresponde a uma página
          disponível no sistema TEC MAX.
        </p>

        <Link to="/" className="not-found-link">
          <ArrowLeft size={18} />
          Voltar ao Painel
        </Link>
      </div>
    </main>
  );
}
