
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../services/api";
import {
  Plus, Pencil, Trash2, X, Save, Package, CheckCircle2,
} from "lucide-react";
import "./ClientePedidos.css";

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

interface ItemFormulario {
  titulo: string;
  preco: string;
  quantidade: string;
}

interface Props {
  clienteId: string;
  onPedidosChange?: (pedidos: Pedido[]) => void;
}

const itemVazio: ItemFormulario = {
  titulo: "",
  preco: "",
  quantidade: "1",
};

function extrairPedidos(data: any): Pedido[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.pedidos)) return data.pedidos;
  return [];
}

function calcularTotal(pedido: Pedido) {
  return (pedido.itens || []).reduce(
    (total, item) =>
      total + Number(item.preco) * Number(item.quantidade),
    0
  );
}

function dinheiro(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(data?: string) {
  if (!data) return "—";

  const valor = new Date(data);

  return Number.isNaN(valor.getTime())
    ? data
    : valor.toLocaleDateString("pt-BR");
}

export default function ClientePedidos({
  clienteId,
  onPedidosChange,
}: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [pedidoEditando, setPedidoEditando] =
    useState<string | number | null>(null);

  const [itens, setItens] = useState<ItemFormulario[]>([
    { ...itemVazio },
  ]);

  async function carregarPedidos() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/clientes/${clienteId}/pedidos`
      );

      const lista = extrairPedidos(response.data);
      setPedidos(lista);
      onPedidosChange?.(lista);
    } catch (err) {
      const erro = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        erro.response?.data?.message ||
        "Não foi possível carregar os pedidos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, [clienteId]);

  function atualizarItem(
    index: number,
    campo: keyof ItemFormulario,
    valor: string
  ) {
    setItens((atuais) =>
      atuais.map((item, i) =>
        i === index ? { ...item, [campo]: valor } : item
      )
    );
  }

  function abrirNovoPedido() {
    setPedidoEditando(null);
    setItens([{ ...itemVazio }]);
    setError("");
    setFormAberto(true);
  }

  function abrirEdicao(pedido: Pedido) {
    setPedidoEditando(pedido.id);
    setItens(
      pedido.itens.map((item) => ({
        titulo: item.titulo,
        preco: String(item.preco),
        quantidade: String(item.quantidade),
      }))
    );
    setError("");
    setFormAberto(true);
  }

  function adicionarItem() {
    setItens((atuais) => [...atuais, { ...itemVazio }]);
  }

  function removerItem(index: number) {
    setItens((atuais) => atuais.filter((_, i) => i !== index));
  }

  async function salvarPedido(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (itens.length === 0) {
      setError("O pedido precisa ter pelo menos um item.");
      return;
    }

    const itensValidos: ItemPedido[] = [];

    for (let index = 0; index < itens.length; index++) {
      const item = itens[index];
      const preco = Number(item.preco);
      const quantidade = Number(item.quantidade);

      if (!item.titulo.trim()) {
        setError(`Preencha o título do item ${index + 1}.`);
        return;
      }

      if (item.preco.trim() === "" || !Number.isFinite(preco) || preco < 0) {
        setError(`O preço do item ${index + 1} deve ser maior ou igual a zero.`);
        return;
      }

      if (
        item.quantidade.trim() === "" ||
        !Number.isInteger(quantidade) ||
        quantidade < 1
      ) {
        setError(`A quantidade do item ${index + 1} precisa ser um inteiro maior que zero.`);
        return;
      }

      itensValidos.push({
        titulo: item.titulo.trim(),
        preco,
        quantidade,
      });
    }

    setSaving(true);

    try {
      if (pedidoEditando !== null) {
        await api.patch(`/pedidos/${pedidoEditando}`, {
          itens: itensValidos,
        });
      } else {
        await api.post(`/clientes/${clienteId}/pedidos`, {
          itens: itensValidos,
        });
      }

      setFormAberto(false);
      setPedidoEditando(null);
      setItens([{ ...itemVazio }]);

      await carregarPedidos();
    } catch (err) {
      const erro = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        erro.response?.data?.message ||
        "Não foi possível salvar o pedido."
      );
    } finally {
      setSaving(false);
    }
  }

  async function alterarStatus(
    pedido: Pedido,
    novoStatus: "pago" | "cancelado"
  ) {
    const descricao =
      novoStatus === "pago" ? "marcar como pago" : "cancelar";

    if (
      !window.confirm(
        `Deseja realmente ${descricao} o pedido #${pedido.id}?`
      )
    ) {
      return;
    }

    setError("");

    try {
      await api.patch(`/pedidos/${pedido.id}`, {
        status: novoStatus,
      });

      await carregarPedidos();
    } catch (err) {
      const erro = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        erro.response?.data?.message ||
        "Não foi possível alterar o status."
      );
    }
  }

  async function excluirPedido(pedido: Pedido) {
    if (
      !window.confirm(
        `Deseja excluir o pedido #${pedido.id}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setError("");

    try {
      await api.delete(`/pedidos/${pedido.id}`);
      await carregarPedidos();
    } catch (err) {
      const erro = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        erro.response?.data?.message ||
        "Não foi possível excluir o pedido."
      );
    }
  }

  return (
    <section className="customer-orders">
      <div className="customer-orders-heading">
        <div>
          <h3>Pedidos do cliente</h3>
          <p>Compras e movimentações comerciais.</p>
        </div>

        <button
          className="order-primary-button"
          onClick={abrirNovoPedido}
        >
          <Plus size={18} />
          Novo pedido
        </button>
      </div>

      {error && (
        <div className="order-error" role="alert">
          {error}
        </div>
      )}

      {formAberto && (
        <form className="order-form" onSubmit={salvarPedido}>
          <div className="order-form-heading">
            <h4>
              {pedidoEditando !== null
                ? `Editar pedido #${pedidoEditando}`
                : "Criar novo pedido"}
            </h4>

            <button
              type="button"
              className="order-close"
              onClick={() => setFormAberto(false)}
              aria-label="Fechar formulário"
            >
              <X size={20} />
            </button>
          </div>

          {itens.map((item, index) => (
            <div className="order-item-form" key={index}>
              <div className="order-item-title">
                <label>Produto / item {index + 1}</label>
                <input
                  value={item.titulo}
                  onChange={(e) =>
                    atualizarItem(index, "titulo", e.target.value)
                  }
                  placeholder="Ex.: Teclado mecânico RGB"
                  required
                />
              </div>

              <div>
                <label>Preço (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.preco}
                  onChange={(e) =>
                    atualizarItem(index, "preco", e.target.value)
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantidade}
                  onChange={(e) =>
                    atualizarItem(index, "quantidade", e.target.value)
                  }
                  required
                />
              </div>

              {itens.length > 1 && (
                <button
                  type="button"
                  className="order-remove-item"
                  onClick={() => removerItem(index)}
                  title="Remover item"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="order-add-item"
            onClick={adicionarItem}
          >
            <Plus size={17} /> Adicionar outro item
          </button>

          <div className="order-form-footer">
            <button
              type="button"
              className="order-cancel-button"
              onClick={() => setFormAberto(false)}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="order-primary-button"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Salvando..." : "Salvar pedido"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="order-state">Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <div className="order-state">
          <Package size={34} />
          <strong>Nenhum pedido cadastrado</strong>
          <span>Este cliente ainda não realizou compras.</span>
        </div>
      ) : (
        <div className="customer-order-list">
          {pedidos.map((pedido) => {
            const total = calcularTotal(pedido);

            return (
              <article className="customer-order-card" key={pedido.id}>
                <div className="customer-order-top">
                  <div>
                    <span className="order-number">
                      PEDIDO #{pedido.id}
                    </span>
                    <strong>{dinheiro(total)}</strong>
                    <span className="order-date">
                      {dataBR(pedido.data)}
                    </span>
                  </div>

                  <span className={`order-status ${pedido.status}`}>
                    {pedido.status}
                  </span>
                </div>

                <div className="order-products">
                  {(pedido.itens || []).map((item, index) => (
                    <div key={index}>
                      <span>
                        {item.titulo} × {item.quantidade}
                      </span>
                      <strong>
                        {dinheiro(item.preco * item.quantidade)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="customer-order-actions">
                  {pedido.status === "aberto" && (
                    <>
                      <button
                        onClick={() => abrirEdicao(pedido)}
                        className="order-action-button"
                      >
                        <Pencil size={16} /> Editar itens
                      </button>

                      <button
                        onClick={() => alterarStatus(pedido, "pago")}
                        className="order-action-button success"
                      >
                        <CheckCircle2 size={16} /> Marcar pago
                      </button>

                      <button
                        onClick={() => alterarStatus(pedido, "cancelado")}
                        className="order-action-button danger"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {pedido.status === "pago" && (
                    <button
                      onClick={() => alterarStatus(pedido, "cancelado")}
                      className="order-action-button danger"
                    >
                      Cancelar pedido
                    </button>
                  )}

                  <button
                    onClick={() => excluirPedido(pedido)}
                    className="order-action-button danger"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
