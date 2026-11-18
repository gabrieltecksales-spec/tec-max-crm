
import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

import { api } from "../services/api";
import ClientePedidos from "../components/ClientePedidos";
import ClienteAtendimentos from "../components/ClienteAtendimentos";
import "./Clientes.css";

interface Cliente {
  id: string | number;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cidade?: string;
}

interface Pedido {
  id: string | number;
  status: string;
  data?: string;
  itens: {
    titulo: string;
    preco: number;
    quantidade: number;
  }[];
}

interface Formulario {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cidade: string;
}

const formularioInicial: Formulario = {
  nome: "",
  email: "",
  telefone: "",
  empresa: "",
  cidade: "",
};

function extrairLista<T>(data: unknown, chave: string): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const lista = (data as Record<string, unknown>)[chave];
    if (Array.isArray(lista)) return lista as T[];
  }

  return [];
}

function totalPedido(pedido: Pedido): number {
  return (pedido.itens || []).reduce(
    (total, item) =>
      total + Number(item.preco) * Number(item.quantidade),
    0
  );
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function seloCliente(pedidos: Pedido[]): string {
  const validos = pedidos.filter(
    (pedido) => pedido.status !== "cancelado"
  );

  if (validos.length === 0) return "Sem compras";

  const total = validos.reduce(
    (soma, pedido) => soma + totalPedido(pedido),
    0
  );

  return total >= 2000 ? "VIP" : "Regular";
}

function mensagemErro(error: unknown): string {
  const erro = error as {
    response?: {
      status?: number;
      data?: { message?: string };
    };
  };

  const status = erro.response?.status;

  if (status === 400) return "Confira os dados informados.";
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 404) return "Registro não encontrado.";
  if (status === 409) return "Este e-mail já está cadastrado.";
  if (status === 500) return "Erro interno do servidor. Tente novamente.";

  return erro.response?.data?.message ||
    "Não foi possível conectar ao servidor.";
}

export default function Clientes() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const caminho = location.pathname;

  const isList = caminho === "/clientes";
  const isCreate = caminho === "/clientes/novo";
  const isEdit = caminho.endsWith("/editar");
  const isDetail = Boolean(id) && !isEdit;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(0);
  const [selos, setSelos] = useState<Record<string, string>>({});

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [formulario, setFormulario] = useState(formularioInicial);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // LISTAGEM DE CLIENTES
  useEffect(() => {
    if (!isList) return;

    let ativo = true;

    async function carregarClientes() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/clientes", {
          params: {
            q: busca.trim(),
            limit: 5,
            skip: pagina * 5,
          },
        });

        const lista = extrairLista<Cliente>(
          response.data,
          "clientes"
        );

        const informado = Number(response.data?.total);
        const quantidade = Number.isFinite(informado)
          ? informado
          : lista.length;

        if (!ativo) return;

        setClientes(lista);
        setTotal(quantidade);

        const resultados = await Promise.all(
          lista.map(async (item) => {
            try {
              const resposta = await api.get(
                `/clientes/${item.id}/pedidos`
              );

              const listaPedidos = extrairLista<Pedido>(
                resposta.data,
                "pedidos"
              );

              return [
                String(item.id),
                seloCliente(listaPedidos),
              ] as const;
            } catch {
              return [String(item.id), "Sem compras"] as const;
            }
          })
        );

        if (ativo) {
          setSelos(Object.fromEntries(resultados));
        }
      } catch (err) {
        if (ativo) setError(mensagemErro(err));
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarClientes();

    return () => {
      ativo = false;
    };
  }, [isList, busca, pagina]);

  // DETALHES DO CLIENTE E PEDIDOS
  useEffect(() => {
    if (!isDetail || !id) return;

    let ativo = true;

    async function carregarDetalhes() {
      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const [clienteResponse, pedidosResponse] = await Promise.all([
          api.get(`/clientes/${id}`),
          api.get(`/clientes/${id}/pedidos`),
        ]);

        if (!ativo) return;

        const dadosCliente =
          clienteResponse.data?.cliente ?? clienteResponse.data;

        setCliente(dadosCliente);

        setPedidos(
          extrairLista<Pedido>(pedidosResponse.data, "pedidos")
        );
      } catch (err) {
        if (!ativo) return;

        const status = (
          err as { response?: { status?: number } }
        ).response?.status;

        if (status === 404) {
          setNotFound(true);
        } else {
          setError(mensagemErro(err));
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDetalhes();

    return () => {
      ativo = false;
    };
  }, [isDetail, id]);

  // CARREGAR DADOS PARA EDIÇÃO
  useEffect(() => {
    if (!isEdit || !id) return;

    let ativo = true;

    async function carregarFormulario() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/clientes/${id}`);
        const dados = response.data?.cliente ?? response.data;

        if (!ativo) return;

        setFormulario({
          nome: dados.nome || "",
          email: dados.email || "",
          telefone: dados.telefone || "",
          empresa: dados.empresa || "",
          cidade: dados.cidade || "",
        });
      } catch (err) {
        if (ativo) setError(mensagemErro(err));
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarFormulario();

    return () => {
      ativo = false;
    };
  }, [isEdit, id]);

  function atualizarCampo(
    campo: keyof Formulario,
    valor: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  // SALVAR CLIENTE
  async function salvarCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const nome = formulario.nome.trim();
    const email = formulario.email.trim();
    const telefone = formulario.telefone.trim();
    const empresa = formulario.empresa.trim();
    const cidade = formulario.cidade.trim();

    if (!nome) {
      setError("O nome do cliente é obrigatório.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    const preenchidos = [telefone, empresa, cidade].filter(Boolean).length;

    if (preenchidos < 2) {
      setError(
        "Preencha pelo menos dois campos entre telefone, empresa e cidade."
      );
      return;
    }

    const dados = { nome, email, telefone, empresa, cidade };

    setSaving(true);

    try {
      if (isEdit && id) {
        await api.patch(`/clientes/${id}`, dados);
        navigate(`/clientes/${id}`);
      } else {
        const response = await api.post("/clientes", dados);
        const novoCliente =
          response.data?.cliente ?? response.data;

        if (novoCliente?.id) {
          navigate(`/clientes/${novoCliente.id}`);
        } else {
          navigate("/clientes");
        }
      }
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setSaving(false);
    }
  }

  // EXCLUIR CLIENTE
  async function excluirCliente() {
    if (!cliente) return;

    const confirmado = window.confirm(
      `Deseja realmente excluir ${cliente.nome}?\n\n` +
      `${pedidos.length} pedido(s) também serão apagados junto. ` +
      "Os atendimentos deste cliente também serão excluídos. Esta ação não pode ser desfeita."
    );

    if (!confirmado) return;

    try {
      await api.delete(`/clientes/${cliente.id}`);
      navigate("/clientes", { replace: true });
    } catch (err) {
      setError(mensagemErro(err));
    }
  }

  // LISTA DE CLIENTES
  if (isList) {
    const totalPaginas = Math.max(1, Math.ceil(total / 5));

    return (
      <section className="clients-page">
        <div className="clients-heading">
          <div>
            <span className="dashboard-eyebrow">BASE COMERCIAL</span>
            <h2>Clientes</h2>
            <p>Gerencie os relacionamentos da TEC MAX.</p>
          </div>

          <Link to="/clientes/novo" className="client-primary-button">
            <Plus size={19} /> Novo cliente
          </Link>
        </div>

        <div className="clients-toolbar">
          <div className="clients-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Pesquisar por nome ou e-mail..."
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(0);
              }}
            />
          </div>

          <span className="clients-total">
            {total} cliente(s) encontrado(s)
          </span>
        </div>

        {error && <div className="clients-error">{error}</div>}

        {loading ? (
          <div className="clients-state">Carregando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="clients-state">
            <Users size={35} />
            <h3>Nenhum cliente encontrado</h3>
            <p>Tente outra pesquisa ou cadastre um novo cliente.</p>
            <Link to="/clientes/novo" className="client-primary-button">
              <Plus size={18} /> Cadastrar cliente
            </Link>
          </div>
        ) : (
          <>
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contato</th>
                    <th>Empresa / Cidade</th>
                    <th>Classificação</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {clientes.map((item) => {
                    const selo = selos[String(item.id)] || "—";

                    return (
                      <tr key={item.id}>
                        <td>
                          <Link
                            to={`/clientes/${item.id}`}
                            className="client-name"
                          >
                            {item.nome}
                          </Link>
                        </td>

                        <td>
                          <span className="client-secondary">
                            {item.email}
                          </span>
                          <span className="client-secondary">
                            {item.telefone || "Sem telefone"}
                          </span>
                        </td>

                        <td>
                          <span>{item.empresa || "—"}</span>
                          <span className="client-secondary">
                            {item.cidade || "—"}
                          </span>
                        </td>

                        <td>
                          <span className={`client-badge ${selo.toLowerCase().replace(" ", "-")}`}>
                            {selo}
                          </span>
                        </td>

                        <td>
                          <Link
                            to={`/clientes/${item.id}`}
                            className="client-view-button"
                          >
                            Visualizar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="clients-pagination">
              <span>
                Página {pagina + 1} de {totalPaginas}
              </span>

              <div>
                <button
                  disabled={pagina === 0}
                  onClick={() => setPagina((atual) => atual - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={19} />
                </button>

                <button
                  disabled={pagina + 1 >= totalPaginas}
                  onClick={() => setPagina((atual) => atual + 1)}
                  aria-label="Próxima página"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    );
  }

  // CADASTRO E EDIÇÃO
  if (isCreate || isEdit) {
    if (isEdit && loading) {
      return <div className="clients-state">Carregando cadastro...</div>;
    }

    return (
      <section className="clients-page">
        <Link
          to={isEdit && id ? `/clientes/${id}` : "/clientes"}
          className="client-back"
        >
          <ArrowLeft size={17} /> Voltar
        </Link>

        <div className="clients-heading">
          <div>
            <span className="dashboard-eyebrow">GESTÃO COMERCIAL</span>
            <h2>{isEdit ? "Editar cliente" : "Novo cliente"}</h2>
            <p>
              {isEdit
                ? "Atualize as informações do cadastro."
                : "Preencha os dados para cadastrar um cliente."}
            </p>
          </div>
        </div>

        {error && <div className="clients-error">{error}</div>}

        <form className="client-form" onSubmit={salvarCliente}>
          <div className="client-form-grid">
            <div className="client-field">
              <label htmlFor="nome">Nome completo *</label>
              <input
                id="nome"
                value={formulario.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div className="client-field">
              <label htmlFor="email">E-mail *</label>
              <input
                id="email"
                type="email"
                value={formulario.email}
                onChange={(e) => atualizarCampo("email", e.target.value)}
                placeholder="cliente@email.com"
                required
              />
            </div>

            <div className="client-field">
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                value={formulario.telefone}
                onChange={(e) => atualizarCampo("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="client-field">
              <label htmlFor="empresa">Empresa</label>
              <input
                id="empresa"
                value={formulario.empresa}
                onChange={(e) => atualizarCampo("empresa", e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="client-field">
              <label htmlFor="cidade">Cidade</label>
              <input
                id="cidade"
                value={formulario.cidade}
                onChange={(e) => atualizarCampo("cidade", e.target.value)}
                placeholder="Cidade do cliente"
              />
            </div>
          </div>

          <p className="client-form-note">
            * Nome e e-mail são obrigatórios. Preencha pelo menos dois
            campos entre telefone, empresa e cidade.
          </p>

          <div className="client-form-actions">
            <Link
              to={isEdit && id ? `/clientes/${id}` : "/clientes"}
              className="client-secondary-button"
            >
              Cancelar
            </Link>

            <button
              className="client-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Cadastrar cliente"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  // DETALHE DO CLIENTE
  if (isDetail) {
    if (loading) {
      return <div className="clients-state">Carregando cliente...</div>;
    }

    if (notFound) {
      return (
        <div className="clients-state">
          <h3>Cliente não encontrado</h3>
          <p>Confira o endereço ou volte para a lista.</p>
          <Link to="/clientes" className="client-primary-button">
            Voltar para clientes
          </Link>
        </div>
      );
    }

    if (!cliente) {
      return (
        <div className="clients-state">
          {error || "Não foi possível carregar este cliente."}
        </div>
      );
    }

    const selo = seloCliente(pedidos);

    const totalComprado = pedidos
      .filter((pedido) => pedido.status !== "cancelado")
      .reduce(
        (total, pedido) => total + totalPedido(pedido),
        0
      );

    return (
      <section className="clients-page">
        <Link to="/clientes" className="client-back">
          <ArrowLeft size={17} /> Voltar para clientes
        </Link>

        {error && <div className="clients-error">{error}</div>}

        <div className="client-detail-heading">
          <div>
            <span className="dashboard-eyebrow">PERFIL DO CLIENTE</span>
            <h2>{cliente.nome}</h2>

            <span className={`client-badge ${selo.toLowerCase().replace(" ", "-")}`}>
              {selo}
            </span>
          </div>

          <div className="client-detail-actions">
            <Link
              to={`/clientes/${id}/editar`}
              className="client-secondary-button"
            >
              <Pencil size={17} /> Editar
            </Link>

            <button
              className="client-delete-button"
              onClick={excluirCliente}
            >
              <Trash2 size={17} /> Excluir
            </button>
          </div>
        </div>

        <article className="client-information">
          <h3>Informações do cliente</h3>

          <div className="client-info-grid">
            <div>
              <Mail size={19} />
              <span>E-mail</span>
              <strong>{cliente.email}</strong>
            </div>

            <div>
              <Phone size={19} />
              <span>Telefone</span>
              <strong>{cliente.telefone || "Não informado"}</strong>
            </div>

            <div>
              <Building2 size={19} />
              <span>Empresa</span>
              <strong>{cliente.empresa || "Não informada"}</strong>
            </div>

            <div>
              <MapPin size={19} />
              <span>Cidade</span>
              <strong>{cliente.cidade || "Não informada"}</strong>
            </div>
          </div>

          <div className="client-purchase-total">
            <span>Total comprado (sem cancelados)</span>
            <strong>{moeda(totalComprado)}</strong>
          </div>
        </article>

        <article className="client-information">
          <ClientePedidos
            clienteId={String(cliente.id)}
            onPedidosChange={setPedidos}
          />
        </article>

        <article className="client-information">
          <ClienteAtendimentos clienteId={String(cliente.id)} />
        </article>
      </section>
    );
  }

  return (
    <div className="clients-state">
      <h3>Página não encontrada</h3>
      <Link to="/clientes">Voltar para clientes</Link>
    </div>
  );
}
