"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Transaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  notes: string;
  created_at: string;
};

const CATEGORIES = [
  "Ventas",
  "Servicios",
  "Productos",
  "Insumos",
  "Mantenimiento",
  "Alquiler",
  "Servicios Públicos",
  "Sueldos",
  "Otros",
];

const INITIAL_TRANSACTION: Partial<Transaction> = {
  type: "income",
  category: "",
  description: "",
  amount: 0,
  date: format(new Date(), "yyyy-MM-dd"),
  notes: "",
};

export default function AdminAccounting() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<
    Partial<Transaction>
  >(INITIAL_TRANSACTION);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  }

  async function handleSave() {
    try {
      if (currentTransaction.id) {
        const { error } = await supabase
          .from("transactions")
          .update(currentTransaction)
          .eq("id", currentTransaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert([currentTransaction]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Error al guardar la transacción.");
    }
  }

  async function handleDelete() {
    if (!transactionToDelete) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionToDelete.id);

    if (!error) {
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
      fetchTransactions();
    } else {
      alert("Error al eliminar la transacción.");
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contabilidad</h1>
          <p className="text-gray-400">
            Seguí los ingresos y egresos del taller.
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentTransaction({ ...INITIAL_TRANSACTION });
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Transacción
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                Ingresos Totales
              </p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                Gastos Totales
              </p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-3 rounded-xl",
                balance >= 0 ? "bg-green-500/10" : "bg-red-500/10"
              )}
            >
              <DollarSign
                className={cn(
                  "w-6 h-6",
                  balance >= 0 ? "text-green-500" : "text-red-500"
                )}
              />
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                Balance
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  balance >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por descripción, categoría o notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "px-4 py-3 rounded-xl font-bold text-sm transition-all",
                typeFilter === type
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              {type === "all" && "Todos"}
              {type === "income" && "Ingresos"}
              {type === "expense" && "Gastos"}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Descripción</th>
                <th className="px-6 py-4 font-bold">Monto</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4 h-16 bg-white/[0.02]" />
                    </tr>
                  ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {t.date
                        ? format(new Date(t.date), "dd MMM yyyy", { locale: es })
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold",
                          t.type === "income"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        )}
                      >
                        {t.type === "income" ? "Ingreso" : "Gasto"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {t.category || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{t.description}</div>
                      {t.notes && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                          {t.notes}
                        </div>
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 font-bold",
                        t.type === "income" ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setCurrentTransaction(t);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTransactionToDelete(t);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 italic"
                  >
                    No hay transacciones registradas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for creating/editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {currentTransaction.id ? "Editar" : "Nueva"} Transacción
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Tipo
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setCurrentTransaction({
                        ...currentTransaction,
                        type: "income",
                      })
                    }
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                      currentTransaction.type === "income"
                        ? "bg-green-500/10 border border-green-500/30 text-green-500"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Ingreso
                  </button>
                  <button
                    onClick={() =>
                      setCurrentTransaction({
                        ...currentTransaction,
                        type: "expense",
                      })
                    }
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                      currentTransaction.type === "expense"
                        ? "bg-red-500/10 border border-red-500/30 text-red-500"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Gasto
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Categoría
                </label>
                <select
                  value={currentTransaction.category || ""}
                  onChange={(e) =>
                    setCurrentTransaction({
                      ...currentTransaction,
                      category: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Descripción
                </label>
                <input
                  type="text"
                  value={currentTransaction.description || ""}
                  onChange={(e) =>
                    setCurrentTransaction({
                      ...currentTransaction,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Ej: Servicio de detailing completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Monto
                  </label>
                  <input
                    type="number"
                    value={currentTransaction.amount || ""}
                    onChange={(e) =>
                      setCurrentTransaction({
                        ...currentTransaction,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={currentTransaction.date || ""}
                    onChange={(e) =>
                      setCurrentTransaction({
                        ...currentTransaction,
                        date: e.target.value,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={currentTransaction.notes || ""}
                  onChange={(e) =>
                    setCurrentTransaction({
                      ...currentTransaction,
                      notes: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSave}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Guardar Transacción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && transactionToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Eliminar Transacción</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar esta transacción{" "}
              <span className="text-white font-bold">
                &quot;{transactionToDelete.description}&quot;
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
