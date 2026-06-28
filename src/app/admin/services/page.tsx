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
  Clock,
  Car,
  AlertTriangle
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  description: string;
  category: "Interior" | "Exterior" | "Completo";
  duration_minutes: number;
  price: number;
  is_active: boolean;
};

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [currentService, setCurrentService] = useState<Partial<Service>>({
    name: "",
    description: "",
    category: "Exterior",
    duration_minutes: 60,
    price: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");
    
    if (data) setServices(data);
    setLoading(false);
  }

  async function handleSave() {
    try {
      if (currentService.id) {
        const { error } = await supabase
          .from("services")
          .update(currentService)
          .eq("id", currentService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("services")
          .insert([currentService]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio.");
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) fetchServices();
  }

  async function handleDelete() {
    if (!serviceToDelete) return;
    
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceToDelete.id);
    
    if (!error) {
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
      fetchServices();
    } else {
      alert("Error al eliminar el servicio.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
          <p className="text-gray-400">Gestioná los tratamientos que ofrecés en el taller.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentService({
              name: "",
              description: "",
              category: "Exterior",
              duration_minutes: 60,
              price: 0,
              is_active: true,
            });
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Services List */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar servicio..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Servicio</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Duración</th>
                <th className="px-6 py-4 font-bold">Precio</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-white/[0.02]" />
                  </tr>
                ))
              ) : services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{service.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{service.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                        service.category === "Exterior" ? "bg-red-500/10 text-red-500" :
                        service.category === "Interior" ? "bg-blue-500/10 text-blue-500" :
                        "bg-green-500/10 text-green-500"
                      )}>
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration_minutes} min
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(service.id, service.is_active)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          service.is_active ? "bg-red-600" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                          service.is_active ? "left-5.5" : "left-0.5"
                        )} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setCurrentService(service);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setServiceToDelete(service);
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No hay servicios creados todavía.
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
              <h2 className="text-2xl font-bold">{currentService.id ? "Editar" : "Nuevo"} Servicio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Nombre del Servicio</label>
                <input 
                  type="text" 
                  value={currentService.name}
                  onChange={(e) => setCurrentService({...currentService, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Ej: Lavado Completo Full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Exterior", "Interior", "Completo"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCurrentService({...currentService, category: cat as any})}
                      className={cn(
                        "py-3 rounded-xl border text-sm font-bold transition-all",
                        currentService.category === cat ? "bg-red-600 border-red-600 text-white" : "bg-black/40 border-white/10 text-gray-400"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Precio</label>
                  <input 
                    type="number" 
                    value={currentService.price}
                    onChange={(e) => setCurrentService({...currentService, price: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Duración (min)</label>
                  <input 
                    type="number" 
                    value={currentService.duration_minutes}
                    onChange={(e) => setCurrentService({...currentService, duration_minutes: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Descripción</label>
                <textarea 
                  rows={4}
                  value={currentService.description}
                  onChange={(e) => setCurrentService({...currentService, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles del servicio..."
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
      {isDeleteModalOpen && serviceToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Eliminar Servicio</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar <span className="text-white font-bold">{serviceToDelete.name}</span>? 
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
