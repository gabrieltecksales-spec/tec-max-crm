
import { Link } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import "./SectionPlaceholder.css";

interface Props {
  title: string;
  description: string;
}

export default function SectionPlaceholder({ title, description }: Props) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-icon">
        <Construction size={28} />
      </div>

      <span className="dashboard-eyebrow">TEC MAX / MÓDULO</span>
      <h2>{title}</h2>
      <p>{description}</p>

      <Link to="/" className="placeholder-link">
        <ArrowLeft size={16} />
        Voltar ao painel
      </Link>
    </section>
  );
}
