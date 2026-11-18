
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react";
import { api } from "../services/api";
import "./ClienteAtendimentos.css";

type Canal = "telefone" | "email" | "whatsapp" | "presencial";

interface Atendimento {
  id: string | number;
  titulo: string;
  texto: string;
  canal: Canal;
  data?: string;
}

interface Formulario {
  titulo: string;
  texto: string;
  canal: Canal;
}

const formularioVazio: Formulario = {
  titulo: "",
  texto: "",
  canal: "whatsapp",
};

const canais: { value: string; label: string }[] = [
  { value: "todos", label: "Todos os canais" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "presencial", label: "Presencial" },
];

function extrairLista(data: unknown): Atendimento[] {
  if (Array.isArray(data)) return data as Atendimento[];

  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Record<string, unknown>).atendimentos)
  ) {
    return (data as { atendimentos: Atendimento[] }).atendimentos;
  }

  return [];
}

function formatarData(data?: string) {
  if (!data) return "Data não informada";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) return data;

  return valor.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function erroApi(error: unknown) {
  const erro = error as {
    response?: {
      status?: number;
      data?: { message?: string };
    };
  };

  const status = erro.response?.status;

  if (status === 400) return "Confira os dados do atendimento.";
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 404) return "Atendimento não encontrado.";
  if (status === 500) return "Erro no servidor. Tente novamente.";

  return erro.response?.data?.message ||
    "Não foi possível concluir a operação.";
}

function iconeCanal(canal: Canal) {
  switch (canal) {
    case "telefone":
      return <Phone size={18} />;
    case "email":
      return <Mail size={18} />;
    case "whatsapp":
      return <MessageCircle size={18} />;
    default:
      return <Users size={18} />;
  }
}

export default function ClienteAtendimentos({
  clienteId,
}: {
  clienteId: string;
}) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | number | null>(null);
  const [formulario, setFormulario] = useState(formularioVazio);

  const carregarAtendimentos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/clientes/${clienteId}/atendimentos`
      );

      const lista = extrairLista(response.data);

      lista.sort((a, b) => {
        const dataA = new Date(a.data || 0).getTime();
        const dataB = new Date(b.data || 0).getTime();
        return dataB - dataA;
      });

      setAtendimentos(lista);
    } catch (err) {
      setError(erroApi(err));
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregarAtendimentos();
  }, [carregarAtendimentos]);

  const atendimentosFiltrados = useMemo(() => {
    if (filtro === "todos") return atendimentos;

    return atendimentos.filter((item) => item.canal === filtro);
  }, [atendimentos, filtro]);

  function novoAtendimento() {
    setEditandoId(null);
    setFormulario({ ...formularioVazio });
    setError("");
    setFormAberto(true);
  }

  function editarAtendimento(item: Atendimento) {
    setEditandoId(item.id);

    setFormulario({
      titulo: item.titulo,
      texto: item.texto,
      canal: item.canal,
    });

    setError("");
    setFormAberto(true);
  }

  function cancelarFormulario() {
    setFormAberto(false);
    setEditandoId(null);
    setFormulario({ ...formularioVazio });
    setError("");
  }

  async function salvarAtendimento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const titulo = formulario.titulo.trim();
    const texto = formulario.texto.trim();

    if (!titulo) {
      setError("O título do atendimento é obrigatório.");
      return;
    }

    if (!texto) {
      setError("A descrição do atendimento é obrigatória.");
      return;
    }

    setSaving(true);

    try {
      const dados = {
        titulo,
        texto,
        canal: formulario.canal,
      };

      if (editandoId !== null) {
        await api.patch(`/atendimentos/${editandoId}`, dados);
      } else {
        await api.post(
          `/clientes/${clienteId}/atendimentos`,
          dados
        );
      }

      cancelarFormulario();
      await carregarAtendimentos();
    } catch (err) {
      setError(erroApi(err));
    } finally {
      setSaving(false);
    }
  }

  async function excluirAtendimento(item: Atendimento) {
    const confirmado = window.confirm(
      `Deseja excluir o atendimento "${item.titulo}"?`
    );

    if (!confirmado) return;

    setError("");

    try {
      await api.delete(`/atendimentos/${item.id}`);
      await carregarAtendimentos();
    } catch (err) {
      setError(erroApi(err));
    }
  }

  return (
    <section className="customer-history">
      <div className="history-heading">
        <div>
          <h3>Histórico de atendimento</h3>
          <p>Registros de contato e relacionamento com o cliente.</p>
        </div>

        <button
          className="history-primary-button"
          onClick={novoAtendimento}
        >
          <Plus size={18} />
          Registrar atendimento
        </button>
      </div>

      <div className="history-toolbar">
        <label htmlFor="filtro-canal">Filtrar por canal</label>

        <select
          id="filtro-canal"
          value={filtro}
          onChange={(event) => setFiltro(event.target.value)}
        >
          {canais.map((canal) => (
            <option key={canal.value} value={canal.value}>
              {canal.label}
            </option>
          ))}
        </select>

        <strong>
          {atendimentosFiltrados.length} atendimento(s)
        </strong>
      </div>

      {error && (
        <div className="history-error" role="alert">
          {error}
        </div>
      )}

      {formAberto && (
        <form className="history-form" onSubmit={salvarAtendimento}>
          <div className="history-form-heading">
            <h4>
              {editandoId !== null
                ? "Editar atendimento"
                : "Novo atendimento"}
            </h4>

            <button
              type="button"
              className="history-close"
              onClick={cancelarFormulario}
              aria-label="Fechar formulário"
            >
              <X size={20} />
            </button>
          </div>

          <div className="history-field">
            <label htmlFor="atendimento-titulo">Título *</label>
            <input
              id="atendimento-titulo"
              value={formulario.titulo}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  titulo: event.target.value,
                })
              }
              placeholder="Ex.: Dúvida sobre teclado mecânico"
              required
            />
          </div>

          <div className="history-field">
            <label htmlFor="atendimento-texto">Descrição *</label>
            <textarea
              id="atendimento-texto"
              value={formulario.texto}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  texto: event.target.value,
                })
              }
              placeholder="Descreva o que foi conversado com o cliente..."
              rows={4}
              required
            />
          </div>

          <div className="history-field">
            <label htmlFor="atendimento-canal">Canal de atendimento *</label>
            <select
              id="atendimento-canal"
              value={formulario.canal}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  canal: event.target.value as Canal,
                })
              }
            >
              <option value="telefone">Telefone</option>
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div className="history-form-actions">
            <button
              type="button"
              className="history-secondary-button"
              onClick={cancelarFormulario}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="history-primary-button"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Salvando..." : "Salvar atendimento"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="history-state">
          Carregando histórico...
        </div>
      ) : atendimentosFiltrados.length === 0 ? (
        <div className="history-state">
          <MessageCircle size={34} />
          <strong>Nenhum atendimento encontrado</strong>
          <span>
            {filtro === "todos"
              ? "Ainda não existem registros para este cliente."
              : "Não há registros neste canal de atendimento."}
          </span>
        </div>
      ) : (
        <div className="history-list">
          {atendimentosFiltrados.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-card-icon">
                {iconeCanal(item.canal)}
              </div>

              <div className="history-card-content">
                <div className="history-card-top">
                  <div>
                    <h4>{item.titulo}</h4>
                    <span className="history-date">
                      {formatarData(item.data)}
                    </span>
                  </div>

                  <span className={`history-channel ${item.canal}`}>
                    {item.canal}
                  </span>
                </div>

                <p>{item.texto}</p>

                <div className="history-card-actions">
                  <button
                    type="button"
                    onClick={() => editarAtendimento(item)}
                  >
                    <Pencil size={15} /> Editar
                  </button>

                  <button
                    type="button"
                    className="history-delete"
                    onClick={() => excluirAtendimento(item)}
                  >
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
