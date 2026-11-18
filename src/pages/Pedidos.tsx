
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, ArrowUpDown } from "lucide-react";
import { api } from "../services/api";
import "./Pedidos.css";

interface Item {
  titulo: string;
  preco: number;
  quantidade: number;
}

interface Pedido {
  id: string | number;
  status: string;
  data?: string;
  itens: Item[];
  clienteId?: string | number;
  cliente_id?: string | number;
  idCliente?: string | number;
  id_cliente?: string | number;
  cliente?: string | { id?: string | number; nome?: string };
  nomeCliente?: string;
  clienteNome?: string;
}

interface Cliente {
  id: string | number;
  nome: string;
  email: string;
}

function lista<T>(data: any, chave: string): T[] {
  const resultado = data?.[chave] ?? data;
  return Array.isArray(resultado) ? resultado : [];
}

function valorPedido(pedido: Pedido): number {
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

function dataBR(data?: string): string {
  if (!data) return "—";

  const valor = new Date(data);

  return Number.isNaN(valor.getTime())
    ? data
    : valor.toLocaleDateString("pt-BR");
}

function identificarCliente(pedido: Pedido) {
  const cliente = pedido.cliente;

  if (cliente && typeof cliente === "object") {
    return {
      id: cliente.id,
      nome: cliente.nome,
    };
  }

  return {
    id:
      pedido.clienteId ??
      pedido.cliente_id ??
      pedido.idCliente ??
      pedido.id_cliente ??
      (typeof cliente === "string" ? cliente : undefined),
    nome: pedido.nomeCliente ?? pedido.clienteNome,
  };
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("todos");
  const [minimo, setMinimo] = useState("");
  const [maximo, setMaximo] = useState("");
  const [ordenacao, setOrdenacao] = useState("data");
  const [direcao, setDirecao] = useState("desc");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setLoading(true);
      setError("");

      try {
        const [pedidosResponse, clientesResponse] = await Promise.all([
          api.get("/pedidos"),
          api.get("/clientes?limit=100"),
        ]);

        if (!ativo) return;

        setPedidos(lista<Pedido>(pedidosResponse.data, "pedidos"));
        setClientes(lista<Cliente>(clientesResponse.data, "clientes"));
      } catch (err) {
        const erro = err as {
          response?: { data?: { message?: string } };
        };

        if (ativo) {
          setError(
            erro.response?.data?.message ||
            "Não foi possível carregar os pedidos."
          );
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const resultado = pedidos.filter((pedido) => {
      const valor = valorPedido(pedido);
      const identificacao = identificarCliente(pedido);

      const clienteEncontrado = clientes.find(
        (cliente) =>
          String(cliente.id) === String(identificacao.id)
      );

      const nomeCliente =
        identificacao.nome ||
        clienteEncontrado?.nome ||
        "Cliente não identificado";

      const emailCliente = clienteEncontrado?.email || "";

      const combinaBusca =
        `${pedido.id} ${nomeCliente} ${emailCliente}`
          .toLowerCase()
          .includes(busca.toLowerCase().trim());

      const combinaStatus =
        status === "todos" || pedido.status === status;

      const combinaMinimo =
        minimo === "" || valor >= Number(minimo);

      const combinaMaximo =
        maximo === "" || valor <= Number(maximo);

      return (
        combinaBusca &&
        combinaStatus &&
        combinaMinimo &&
        combinaMaximo
      );
    });

    return [...resultado].sort((a, b) => {
      let comparacao = 0;

      if (ordenacao === "total") {
        comparacao = valorPedido(a) - valorPedido(b);
      } else {
        const dataA = new Date(a.data || 0).getTime();
        const dataB = new Date(b.data || 0).getTime();
        comparacao = dataA - dataB;
      }

      return direcao === "desc" ? -comparacao : comparacao;
    });
  }, [
    pedidos,
    clientes,
    status,
    minimo,
    maximo,
    ordenacao,
    direcao,
    busca,
  ]);

  return (
    <section className="all-orders-page">
      <div className="all-orders-heading">
        <div>
          <span className="dashboard-eyebrow">CONTROLE COMERCIAL</span>
          <h2>Todos os pedidos</h2>
          <p>Consulte e acompanhe as vendas da TEC MAX.</p>
        </div>

        <div className="all-orders-count">
          <ShoppingBag size={20} />
          {pedidosFiltrados.length} pedido(s)
        </div>
      </div>

      <div className="orders-filters">
        <div className="orders-search">
          <Search size={18} />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por cliente ou pedido..."
          />
        </div>

        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="aberto">Em aberto</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        <label>
          Valor mínimo (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            value={minimo}
            onChange={(event) => setMinimo(event.target.value)}
            placeholder="0,00"
          />
        </label>

        <label>
          Valor máximo (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            value={maximo}
            onChange={(event) => setMaximo(event.target.value)}
            placeholder="Sem limite"
          />
        </label>

        <label>
          Ordenar por
          <select
            value={ordenacao}
            onChange={(event) => setOrdenacao(event.target.value)}
          >
            <option value="data">Data</option>
            <option value="total">Valor total</option>
          </select>
        </label>

        <button
          className="orders-sort-button"
          onClick={() =>
            setDirecao((atual) =>
              atual === "desc" ? "asc" : "desc"
            )
          }
        >
          <ArrowUpDown size={17} />
          {direcao === "desc" ? "Decrescente" : "Crescente"}
        </button>
      </div>

      {error && <div className="clients-error">{error}</div>}

      {loading ? (
        <div className="clients-state">Carregando pedidos...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="clients-state">
          <ShoppingBag size={35} />
          <h3>Nenhum pedido encontrado</h3>
          <p>Altere os filtros para consultar outros pedidos.</p>
        </div>
      ) : (
        <div className="all-orders-table-wrap">
          <table className="all-orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Itens</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {pedidosFiltrados.map((pedido) => {
                const identificacao = identificarCliente(pedido);

                const clienteEncontrado = clientes.find(
                  (cliente) =>
                    String(cliente.id) === String(identificacao.id)
                );

                const nome =
                  identificacao.nome ||
                  clienteEncontrado?.nome ||
                  "Cliente não identificado";

                const idCliente =
                  identificacao.id ?? clienteEncontrado?.id;

                return (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>

                    <td>
                      {idCliente ? (
                        <Link
                          to={`/clientes/${idCliente}`}
                          className="all-orders-client-link"
                        >
                          {nome}
                        </Link>
                      ) : (
                        <span>{nome}</span>
                      )}
                    </td>

                    <td>{dataBR(pedido.data)}</td>
                    <td>{pedido.itens?.length || 0}</td>

                    <td>
                      <span className={`order-status ${pedido.status}`}>
                        {pedido.status}
                      </span>
                    </td>

                    <td className="all-orders-value">
                      {moeda(valorPedido(pedido))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
