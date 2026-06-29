"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Download,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  created_at: string;
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  async function handleSave() {
    try {
      if (currentClient.id) {
        const { error } = await supabase
          .from("clients")
          .update({
            first_name: currentClient.first_name,
            last_name: currentClient.last_name,
            email: currentClient.email,
            phone: currentClient.phone,
            address: currentClient.address,
            notes: currentClient.notes,
          })
          .eq("id", currentClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert([{
            first_name: currentClient.first_name,
            last_name: currentClient.last_name,
            email: currentClient.email,
            phone: currentClient.phone,
            address: currentClient.address,
            notes: currentClient.notes,
          }]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error al guardar el cliente.");
    }
  }

  async function handleDelete() {
    if (!clientToDelete) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientToDelete.id);

    if (!error) {
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      fetchClients();
    } else {
      alert("Error al eliminar el cliente.");
    }
  }

  function exportToCSV(data: Client[], filename: string) {
    const headers = ["Nombre", "Apellido", "Email", "Teléfono", "Dirección", "Notas"];
    const rows = data.map(client => [
      client.first_name,
      client.last_name,
      client.email,
      client.phone,
      client.address,
      client.notes,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Clientes</h1>
          <p className="text-gray-400">Total de {clients.length} clientes registrados.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(clients, `clientes_${format(new Date(), "yyyy-MM-dd")}.csv`)}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-sm"
          >
            <Download className="w-4 h-4 text-red-500" />
            Exportar CSV
          </button>
          <button
            onClick={() => {
              setCurrentClient({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                address: "",
                notes: "",
              });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-400">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 hover:border-red-500/30 transition-all group">
              <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 font-bold text-xl uppercase">
                  {client.first_name[0]}{client.last_name[0]}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCurrentClient(client);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setClientToDelete(client);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold">{client.first_name} {client.last_name}</h3>
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-red-500/50" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-red-500/50" />
                    {client.phone}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all">
                  Ver Historial
                </button>
                <a
                  href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-all"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Create/Edit Slide-in Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{currentClient.id ? "Editar" : "Nuevo"} Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Nombre</label>
                  <input
                    type="text"
                    value={currentClient.first_name || ""}
                    onChange={(e) => setCurrentClient({...currentClient, first_name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Apellido</label>
                  <input
                    type="text"
                    value={currentClient.last_name || ""}
                    onChange={(e) => setCurrentClient({...currentClient, last_name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Apellido"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Email</label>
                <input
                  type="email"
                  value={currentClient.email || ""}
                  onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Teléfono</label>
                <input
                  type="tel"
                  value={currentClient.phone || ""}
                  onChange={(e) => setCurrentClient({...currentClient, phone: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Dirección</label>
                <input
                  type="text"
                  value={currentClient.address || ""}
                  onChange={(e) => setCurrentClient({...currentClient, address: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Dirección del cliente"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Notas</label>
                <textarea
                  rows={4}
                  value={currentClient.notes || ""}
                  onChange={(e) => setCurrentClient({...currentClient, notes: e.target.value})}
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
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Eliminar Cliente</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar a <span className="text-white font-bold">{clientToDelete.first_name} {clientToDelete.last_name}</span>?
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
