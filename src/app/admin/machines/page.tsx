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
  Cog,
  AlertTriangle,
  Wrench,
  Activity,
  DollarSign,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Machine = {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: number;
  status: "active" | "maintenance" | "inactive";
  last_maintenance: string;
  next_maintenance: string;
  notes: string;
};

const statusConfig = {
  active: { label: "Activa", className: "bg-green-500/10 text-green-500" },
  maintenance: { label: "Mantenimiento", className: "bg-yellow-500/10 text-yellow-500" },
  inactive: { label: "Inactiva", className: "bg-gray-500/10 text-gray-500" },
};

const emptyMachine: Partial<Machine> = {
  name: "",
  brand: "",
  model: "",
  serial_number: "",
  purchase_date: "",
  purchase_price: 0,
  status: "active",
  last_maintenance: "",
  next_maintenance: "",
  notes: "",
};

export default function AdminMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [currentMachine, setCurrentMachine] = useState<Partial<Machine>>(emptyMachine);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMachines();
  }, []);

  async function fetchMachines() {
    setLoading(true);
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .order("name");

    if (data) setMachines(data);
    setLoading(false);
  }

  async function handleSave() {
    try {
      if (currentMachine.id) {
        const { error } = await supabase
          .from("machines")
          .update(currentMachine)
          .eq("id", currentMachine.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("machines")
          .insert([currentMachine]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchMachines();
    } catch (error) {
      console.error("Error saving machine:", error);
      alert("Error al guardar la máquina.");
    }
  }

  async function handleDelete() {
    if (!machineToDelete) return;

    const { error } = await supabase
      .from("machines")
      .delete()
      .eq("id", machineToDelete.id);

    if (!error) {
      setIsDeleteModalOpen(false);
      setMachineToDelete(null);
      fetchMachines();
    } else {
      alert("Error al eliminar la máquina.");
    }
  }

  const filteredMachines = machines.filter((machine) => {
    const term = searchTerm.toLowerCase();
    return (
      machine.name?.toLowerCase().includes(term) ||
      machine.brand?.toLowerCase().includes(term) ||
      machine.model?.toLowerCase().includes(term) ||
      machine.serial_number?.toLowerCase().includes(term)
    );
  });

  const activeMachines = machines.filter((m) => m.status === "active").length;
  const maintenanceMachines = machines.filter((m) => m.status === "maintenance").length;
  const totalValue = machines.reduce((sum, m) => sum + (m.purchase_price || 0), 0);

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Máquinas</h1>
          <p className="text-gray-400">Gestioná las máquinas y equipos del taller.</p>
        </div>
        <button
          onClick={() => {
            setCurrentMachine({ ...emptyMachine });
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Máquina
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-gray-500">
              Máquinas Activas
            </span>
          </div>
          <p className="text-3xl font-bold">{activeMachines}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <Wrench className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-gray-500">
              En Mantenimiento
            </span>
          </div>
          <p className="text-3xl font-bold">{maintenanceMachines}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-gray-500">
              Valor Total Inventario
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, marca, modelo o serie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      {/* Machines Table */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Nombre</th>
                <th className="px-6 py-4 font-bold">Marca/Modelo</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold">Próx. Mantenimiento</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-16 bg-white/[0.02]" />
                    </tr>
                  ))
              ) : filteredMachines.length > 0 ? (
                filteredMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold">{machine.name}</div>
                      <div className="text-xs text-gray-500">
                        {machine.serial_number || "Sin serie"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {machine.brand && machine.model
                        ? `${machine.brand} ${machine.model}`
                        : machine.brand || machine.model || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                          statusConfig[machine.status]?.className
                        )}
                      >
                        {statusConfig[machine.status]?.label || machine.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(machine.next_maintenance)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setCurrentMachine(machine);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMachineToDelete(machine);
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
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 italic"
                  >
                    No hay máquinas registradas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {currentMachine.id ? "Editar" : "Nueva"} Máquina
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
                  Nombre
                </label>
                <input
                  type="text"
                  value={currentMachine.name || ""}
                  onChange={(e) =>
                    setCurrentMachine({ ...currentMachine, name: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Ej: Pulidora Roto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={currentMachine.brand || ""}
                    onChange={(e) =>
                      setCurrentMachine({ ...currentMachine, brand: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: Rupes"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={currentMachine.model || ""}
                    onChange={(e) =>
                      setCurrentMachine({ ...currentMachine, model: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: BigFoot"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Número de Serie
                </label>
                <input
                  type="text"
                  value={currentMachine.serial_number || ""}
                  onChange={(e) =>
                    setCurrentMachine({
                      ...currentMachine,
                      serial_number: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Ej: RF-2024-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    value={currentMachine.purchase_date || ""}
                    onChange={(e) =>
                      setCurrentMachine({
                        ...currentMachine,
                        purchase_date: e.target.value,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Precio de Compra
                  </label>
                  <input
                    type="number"
                    value={currentMachine.purchase_price || 0}
                    onChange={(e) =>
                      setCurrentMachine({
                        ...currentMachine,
                        purchase_price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Estado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["active", "maintenance", "inactive"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        setCurrentMachine({ ...currentMachine, status })
                      }
                      className={cn(
                        "py-3 rounded-xl border text-sm font-bold transition-all",
                        currentMachine.status === status
                          ? status === "active"
                            ? "bg-green-600 border-green-600 text-white"
                            : status === "maintenance"
                            ? "bg-yellow-600 border-yellow-600 text-white"
                            : "bg-gray-600 border-gray-600 text-white"
                          : "bg-black/40 border-white/10 text-gray-400"
                      )}
                    >
                      {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Último Mantenimiento
                  </label>
                  <input
                    type="date"
                    value={currentMachine.last_maintenance || ""}
                    onChange={(e) =>
                      setCurrentMachine({
                        ...currentMachine,
                        last_maintenance: e.target.value,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Próximo Mantenimiento
                  </label>
                  <input
                    type="date"
                    value={currentMachine.next_maintenance || ""}
                    onChange={(e) =>
                      setCurrentMachine({
                        ...currentMachine,
                        next_maintenance: e.target.value,
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
                  value={currentMachine.notes || ""}
                  onChange={(e) =>
                    setCurrentMachine({ ...currentMachine, notes: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSave}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && machineToDelete && (
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
              <h3 className="text-xl font-bold">Eliminar Máquina</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="text-white font-bold">{machineToDelete.name}</span>?
              Esta acción no se puede deshacer.
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
