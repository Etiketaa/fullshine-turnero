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
  Car,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

type Vehicle = {
  id: string;
  client_id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  notes: string;
  client?: {
    first_name: string;
    last_name: string;
  };
};

type Client = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle>>({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    license_plate: "",
    notes: "",
  });
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select(`
        *,
        client:clients(first_name, last_name)
      `)
      .order("created_at", { ascending: false });
    
    if (data) setVehicles(data);
    setLoading(false);
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name")
      .order("first_name");
    
    if (data) setClients(data);
  }

  async function handleSave() {
    try {
      const vehicleData = {
        ...currentVehicle,
        client_id: selectedClientId,
      };

      if (currentVehicle.id) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", currentVehicle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert([vehicleData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Error al guardar el vehículo.");
    }
  }

  async function handleDelete() {
    if (!vehicleToDelete) return;
    
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleToDelete.id);
    
    if (!error) {
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);
      fetchVehicles();
    } else {
      alert("Error al eliminar el vehículo.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-gray-400">Gestioná los vehículos de tus clientes.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentVehicle({
              brand: "",
              model: "",
              year: new Date().getFullYear(),
              color: "",
              license_plate: "",
              notes: "",
            });
            setSelectedClientId("");
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Vehículo
        </button>
      </div>

      {/* Vehicles List */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar vehículo..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Vehículo</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Patente</th>
                <th className="px-6 py-4 font-bold">Color</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-16 bg-white/[0.02]" />
                  </tr>
                ))
              ) : vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{vehicle.brand} {vehicle.model}</div>
                      <div className="text-xs text-gray-500">{vehicle.year}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {vehicle.client?.first_name} {vehicle.client?.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-400">
                      {vehicle.license_plate || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {vehicle.color || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setCurrentVehicle(vehicle);
                            setSelectedClientId(vehicle.client_id);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setVehicleToDelete(vehicle);
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    No hay vehículos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{currentVehicle.id ? "Editar" : "Nuevo"} Vehículo</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Marca</label>
                  <input 
                    type="text" 
                    value={currentVehicle.brand}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, brand: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Modelo</label>
                  <input 
                    type="text" 
                    value={currentVehicle.model}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, model: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: Corolla"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Año</label>
                  <input 
                    type="number" 
                    value={currentVehicle.year}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, year: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Color</label>
                  <input 
                    type="text" 
                    value={currentVehicle.color}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, color: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: Blanco"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Patente</label>
                <input 
                  type="text" 
                  value={currentVehicle.license_plate}
                  onChange={(e) => setCurrentVehicle({...currentVehicle, license_plate: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Ej: ABC 123"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Notas</label>
                <textarea 
                  rows={3}
                  value={currentVehicle.notes}
                  onChange={(e) => setCurrentVehicle({...currentVehicle, notes: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles del vehículo..."
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
      {isDeleteModalOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Eliminar Vehículo</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar el vehículo <span className="text-white font-bold">{vehicleToDelete.brand} {vehicleToDelete.model}</span>? 
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
