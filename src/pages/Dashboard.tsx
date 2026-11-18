
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Wallet,
  Receipt,
  ShoppingBag,
  RefreshCw,
  Trophy,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import { api } from "../services/api";
import "./Dashboard.css";

interface ItemPedido {
  titulo: string;
  preco: number;
  quantidade: number;
}

interface Pedido {
  id: string | number;
  status: "aberto" | "pago" | "cancelado";
  data?: string;
  itens: ItemPedido[];
}

interface Cliente {
  id: string | number;
  nome: string;
  email?: string;
}

interface RankingCliente {
  id: string | number;
  nome: string;
  total: number;
}

interface StatusResumo {
  quantidade: number;
  valor: number;
}

interface DashboardData {
  clientes: number;
  totalVendido: number;
  ticketMedio: number;
  pedidosValidos: number;
  aberto: StatusResumo;
  pago: StatusResumo;
  cancelado: StatusResumo;
  ranking: RankingCliente[];
  quantidadePedidos: number;
}

const inicial: DashboardData = {
  clientes: 0,
  totalVendido: 0,
  ticketMedio: 0,
  pedidosValidos: 0,
  aberto: { quantidade: 0, valor: 0 },
  pago: { quantidade: 0, valor: 0 },
  cancelado: { quantidade: 0, valor: 0 },
  ranking: [],
  quantidadePedidos: 0,
};

function extrairLista<T>(data: unknown, chave: string): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const lista = (data as Record<string, unknown>)[chave];
    if (Array.isArray(lista)) return lista as T[];
  }

  return [];
}

function calcularTotalPedido(pedido: Pedido): number {
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

function mensagemErro(error: unknown): string {
  const err = error as {
    response?: {
      status?: number;
      data?: { message?: string };
    };
  };

  const status = err.response?.status;

  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 500) return "Erro no servidor. Tente novamente.";

  return err.response?.data?.message ||
    "Não foi possível carregar os dados do painel.";
}

export default function Dashboard() {
  const [dados, setDados] = useState(inicial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarPainel = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [clientesResponse, pedidosResponse] = await Promise.all([
        api.get("/clientes?limit=100&skip=0"),
        api.get("/pedidos"),
      ]);

      const clientes = extrairLista<Cliente>(
        clientesResponse.data,
        "clientes"
      );

      const pedidos = extrairLista<Pedido>(
        pedidosResponse.data,
        "pedidos"
      );

      const totalClientes = Number(clientesResponse.data?.total);

      // Calcula os valores separados por status.
      const aberto: StatusResumo = { quantidade: 0, valor: 0 };
      const pago: StatusResumo = { quantidade: 0, valor: 0 };
      const cancelado: StatusResumo = { quantidade: 0, valor: 0 };

      pedidos.forEach((pedido) => {
        const valor = calcularTotalPedido(pedido);

        if (pedido.status === "aberto") {
          aberto.quantidade++;
          aberto.valor += valor;
        } else if (pedido.status === "pago") {
          pago.quantidade++;
          pago.valor += valor;
        } else if (pedido.status === "cancelado") {
          cancelado.quantidade++;
          cancelado.valor += valor;
        }
      });

      // Vendas e ticket médio desconsideram os cancelamentos.
      const pedidosValidos = pedidos.filter(
        (pedido) => pedido.status !== "cancelado"
      );

      const totalVendido = pedidosValidos.reduce(
        (total, pedido) => total + calcularTotalPedido(pedido),
        0
      );

      // Calcula compras de cada cliente sem contar cancelados.
      const resultadosRanking = await Promise.all(
        clientes.map(async (cliente): Promise<RankingCliente> => {
          try {
            const response = await api.get(
              `/clientes/${cliente.id}/pedidos`
            );

            const pedidosCliente = extrairLista<Pedido>(
              response.data,
              "pedidos"
            );

            const total = pedidosCliente
              .filter((pedido) => pedido.status !== "cancelado")
              .reduce(
                (soma, pedido) => soma + calcularTotalPedido(pedido),
                0
              );

            return {
              id: cliente.id,
              nome: cliente.nome,
              total,
            };
          } catch {
            return {
              id: cliente.id,
              nome: cliente.nome,
              total: 0,
            };
          }
        })
      );

      const ranking = [...resultadosRanking]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      setDados({
        clientes: Number.isFinite(totalClientes)
          ? totalClientes
          : clientes.length,
        totalVendido,
        ticketMedio:
          pedidosValidos.length > 0
            ? totalVendido / pedidosValidos.length
            : 0,
        pedidosValidos: pedidosValidos.length,
        aberto,
        pago,
        cancelado,
        ranking,
        quantidadePedidos: pedidos.length,
      });
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPainel();
  }, [carregarPainel]);

  const cards = [
    {
      titulo: "Clientes cadastrados",
      valor: dados.clientes.toLocaleString("pt-BR"),
      descricao: "Base total de clientes",
      icone: Users,
    },
    {
      titulo: "Total vendido",
      valor: moeda(dados.totalVendido),
      descricao: "Sem pedidos cancelados",
      icone: Wallet,
    },
    {
      titulo: "Ticket médio",
      valor: moeda(dados.ticketMedio),
      descricao: "Por pedido válido",
      icone: Receipt,
    },
    {
      titulo: "Total de pedidos",
      valor: dados.quantidadePedidos.toString(),
      descricao: "Todos os status",
      icone: ShoppingBag,
    },
  ];

  const statusCards = [
    {
      nome: "Em aberto",
      classe: "open",
      resumo: dados.aberto,
    },
    {
      nome: "Pagos",
      classe: "paid",
      resumo: dados.pago,
    },
    {
      nome: "Cancelados",
      classe: "cancelled",
      resumo: dados.cancelado,
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">TEC MAX / VISÃO GERAL</span>
          <h2>Painel de controle</h2>
          <p>Resumo comercial e desempenho da loja.</p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={carregarPainel}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "refresh-spinning" : ""}
          />
          Atualizar dados
        </button>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
          <button onClick={carregarPainel}>Tentar novamente</button>
        </div>
      )}

      <section className="metrics-grid">
        {cards.map((card) => {
          const Icon = card.icone;

          return (
            <article className="metric-card" key={card.titulo}>
              <div className="metric-top">
                <span>{card.titulo}</span>
                <div className="metric-icon">
                  <Icon size={21} />
                </div>
              </div>

              <strong className="metric-value">
                {loading ? "Carregando..." : card.valor}
              </strong>

              <span className="metric-description">
                {card.descricao}
              </span>
            </article>
          );
        })}
      </section>

      <section className="dashboard-lower">
        <article className="status-card">
          <div className="section-heading">
            <div>
              <span className="dashboard-eyebrow">ACOMPANHAMENTO</span>
              <h3>Pedidos por status</h3>
            </div>

            <span className="status-total">
              {dados.quantidadePedidos}
            </span>
          </div>

          {loading ? (
            <p className="dashboard-muted">Carregando pedidos...</p>
          ) : (
            <div className="status-list">
              {statusCards.map((item) => {
                const quantidadeTotal = dados.quantidadePedidos;

                const percentual =
                  quantidadeTotal > 0
                    ? (item.resumo.quantidade / quantidadeTotal) * 100
                    : 0;

                return (
                  <div className="status-item" key={item.classe}>
                    <div className="status-item-heading">
                      <span>{item.nome}</span>
                      <strong>
                        {item.resumo.quantidade} pedido(s)
                      </strong>
                    </div>

                    <div className="status-track">
                      <div
                        className={`status-fill ${item.classe}`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>

                    <div className="status-money">
                      {moeda(item.resumo.valor)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="ranking-card">
          <div className="section-heading">
            <div>
              <span className="dashboard-eyebrow">DESEMPENHO</span>
              <h3>Top 3 clientes</h3>
            </div>

            <Trophy size={21} className="ranking-trophy" />
          </div>

          {loading ? (
            <p className="dashboard-muted">Calculando ranking...</p>
          ) : dados.ranking.length === 0 ? (
            <p className="dashboard-muted">
              Nenhum cliente cadastrado.
            </p>
          ) : (
            <div className="ranking-list">
              {dados.ranking.map((cliente, index) => (
                <Link
                  to={`/clientes/${cliente.id}`}
                  className="ranking-item"
                  key={cliente.id}
                >
                  <span className="ranking-position">
                    {index + 1}
                  </span>

                  <div className="ranking-info">
                    <strong>{cliente.nome}</strong>
                    <span>{moeda(cliente.total)}</span>
                  </div>

                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          )}

          <Link to="/clientes" className="ranking-footer">
            Ver todos os clientes
          </Link>
        </article>
      </section>

      <section className="dashboard-bottom">
        <div>
          <Clock3 size={22} />
          <div>
            <strong>Resumo da operação</strong>
            <p>
              {dados.pedidosValidos} pedido(s) válidos no sistema,
              incluindo pedidos abertos e pagos.
            </p>
          </div>
        </div>

        <Link to="/pedidos">
          Consultar pedidos <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}
