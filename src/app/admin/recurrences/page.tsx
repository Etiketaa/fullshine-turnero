"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Calendar,
  RefreshCw,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Zap,
} from "lucide-react";
import { cn, formatCurrency, formatDuration } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Recurrence = {
  id: string;
  client_id: string;
  vehicle_id: string;
  service_id: string;
  frequency: "daily" | "weekly" | "monthly";
  day_of_week: number | null;
  day_of_month: number | null;
  time: string;
  duration_minutes: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  client?: { first_name: string; last_name: string };
  vehicle?: { brand: string; model: string; license_plate: string };
  service?: { name: string; duration_minutes: number };
};

type Client = { id: string; first_name: string; last_name: string };
type Vehicle = { id: string; client_id: string; brand: string; model: string; license_plate: string };
type Service = { id: string; name: string; duration_minutes: number; price: number };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
};

const FREQUENCY_COLORS: Record<string, string> = {
  daily: "bg-blue-500/10 text-blue-500",
  weekly: "bg-purple-500/10 text-purple-500",
  monthly: "bg-orange-500/10 text-orange-500",
};

export default function AdminRecurrences() {
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recurrenceToDelete, setRecurrenceToDelete] = useState<Recurrence | null>(null);
  const [generating, setGenerating] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [currentRecurrence, setCurrentRecurrence] = useState<Partial<Recurrence>>({
    frequency: "weekly",
    day_of_week: 1,
    day_of_month: 1,
    time: "09:00",
    duration_minutes: 60,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: null,
    is_active: true,
  });

  const filteredVehicles = vehicles.filter((v) => v.client_id === selectedClientId);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [recRes, clientRes, vehicleRes, serviceRes] = await Promise.all([
      supabase
        .from("recurrences")
        .select(`
          *,
          client:clients(first_name, last_name),
          vehicle:vehicles(brand, model, license_plate),
          service:services(name, duration_minutes)
        `)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, first_name, last_name").order("first_name"),
      supabase.from("vehicles").select("id, client_id, brand, model, license_plate").order("brand"),
      supabase.from("services").select("id, name, duration_minutes, price").order("name"),
    ]);

    if (recRes.data) setRecurrences(recRes.data);
    if (clientRes.data) setClients(clientRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
    if (serviceRes.data) setServices(serviceRes.data);
    setLoading(false);
  }

  function resetForm() {
    setSelectedClientId("");
    setSelectedVehicleId("");
    setSelectedServiceId("");
    setCurrentRecurrence({
      frequency: "weekly",
      day_of_week: 1,
      day_of_month: 1,
      time: "09:00",
      duration_minutes: 60,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: null,
      is_active: true,
    });
  }

  function openEditModal(recurrence?: Recurrence) {
    if (recurrence) {
      setSelectedClientId(recurrence.client_id);
      setSelectedVehicleId(recurrence.vehicle_id);
      setSelectedServiceId(recurrence.service_id);
      setCurrentRecurrence({ ...recurrence });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  }

  async function handleSave() {
    try {
      const payload = {
        client_id: selectedClientId,
        vehicle_id: selectedVehicleId,
        service_id: selectedServiceId,
        frequency: currentRecurrence.frequency,
        day_of_week: currentRecurrence.frequency === "weekly" ? currentRecurrence.day_of_week : null,
        day_of_month: currentRecurrence.frequency === "monthly" ? currentRecurrence.day_of_month : null,
        time: currentRecurrence.time,
        duration_minutes: currentRecurrence.duration_minutes,
        start_date: currentRecurrence.start_date,
        end_date: currentRecurrence.end_date || null,
        is_active: currentRecurrence.is_active,
      };

      if (currentRecurrence.id) {
        const { error } = await supabase
          .from("recurrences")
          .update(payload)
          .eq("id", currentRecurrence.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recurrences").insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving recurrence:", error);
      alert("Error al guardar la recurrencia.");
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("recurrences")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) fetchData();
  }

  async function handleDelete() {
    if (!recurrenceToDelete) return;
    const { error } = await supabase
      .from("recurrences")
      .delete()
      .eq("id", recurrenceToDelete.id);
    if (!error) {
      setIsDeleteModalOpen(false);
      setRecurrenceToDelete(null);
      fetchData();
    } else {
      alert("Error al eliminar la recurrencia.");
    }
  }

  async function generateTodayAppointments() {
    setGenerating(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const dayOfWeek = new Date().getDay();
      const dayOfMonth = new Date().getDate();

      const { data: activeRecs, error } = await supabase
        .from("recurrences")
        .select(`
          *,
          service:services(name, duration_minutes, price)
        `)
        .eq("is_active", true)
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`);

      if (error) throw error;
      if (!activeRecs || activeRecs.length === 0) {
        alert("No hay recurrencias activas para generar turnos.");
        setGenerating(false);
        return;
      }

      const matching = activeRecs.filter((rec) => {
        if (rec.frequency === "daily") return true;
        if (rec.frequency === "weekly") return rec.day_of_week === dayOfWeek;
        if (rec.frequency === "monthly") return rec.day_of_month === dayOfMonth;
        return false;
      });

      if (matching.length === 0) {
        alert("Ninguna recurrencia coincide con el día de hoy.");
        setGenerating(false);
        return;
      }

      const { data: existingAppointments } = await supabase
        .from("appointments")
        .select("recurrence_id")
        .eq("date", today);

      const existingRecurrenceIds = new Set(
        (existingAppointments || []).map((a) => a.recurrence_id).filter(Boolean)
      );

      const newAppointments = matching
        .filter((rec) => !existingRecurrenceIds.has(rec.id))
        .map((rec) => ({
          client_id: rec.client_id,
          vehicle_id: rec.vehicle_id,
          service_id: rec.service_id,
          date: today,
          time: rec.time,
          duration_minutes: rec.duration_minutes,
          status: "scheduled",
          recurrence_id: rec.id,
          price: rec.service?.price || 0,
        }));

      if (newAppointments.length === 0) {
        alert("Ya se generaron los turnos de hoy para todas las recurrencias activas.");
        setGenerating(false);
        return;
      }

      const { error: insertError } = await supabase.from("appointments").insert(newAppointments);
      if (insertError) throw insertError;

      alert(`Se generaron ${newAppointments.length} turno(s) para hoy.`);
    } catch (error) {
      console.error("Error generating appointments:", error);
      alert("Error al generar los turnos de hoy.");
    }
    setGenerating(false);
  }

  function formatRecurrenceSchedule(rec: Recurrence) {
    if (rec.frequency === "daily") return `Todos los días a las ${rec.time.slice(0, 5)}`;
    if (rec.frequency === "weekly") {
      const dayName = DAYS[rec.day_of_week ?? 0];
      return `${dayName} a las ${rec.time.slice(0, 5)}`;
    }
    return `Día ${rec.day_of_month} de cada mes a las ${rec.time.slice(0, 5)}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurrencias</h1>
          <p className="text-gray-400">
            Gestioná las citas recurrentes de tus clientes. Total: {recurrences.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateTodayAppointments}
            disabled={generating}
            className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-sm disabled:opacity-50"
          >
            <Zap className={cn("w-4 h-4", generating ? "animate-spin text-gray-500" : "text-red-500")} />
            {generating ? "Generando..." : "Generar Turnos de Hoy"}
          </button>
          <button
            onClick={() => openEditModal()}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nueva Recurrencia
          </button>
        </div>
      </div>

      {/* Recurrences Table */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Vehículo</th>
                <th className="px-6 py-4 font-bold">Servicio</th>
                <th className="px-6 py-4 font-bold">Frecuencia</th>
                <th className="px-6 py-4 font-bold">Horario</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-4 h-16 bg-white/[0.02]" />
                    </tr>
                  ))
              ) : recurrences.length > 0 ? (
                recurrences.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">
                        {rec.client?.first_name} {rec.client?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {rec.vehicle?.brand} {rec.vehicle?.model}
                      {rec.vehicle?.license_plate && (
                        <span className="text-gray-600 ml-2">({rec.vehicle.license_plate})</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm">{rec.service?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider",
                          FREQUENCY_COLORS[rec.frequency]
                        )}
                      >
                        {FREQUENCY_LABELS[rec.frequency]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                        {formatRecurrenceSchedule(rec)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {format(new Date(rec.start_date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                        {rec.end_date
                          ? ` — ${format(new Date(rec.end_date + "T00:00:00"), "d MMM yyyy", { locale: es })}`
                          : " — Sin fin"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(rec.id, rec.is_active)}
                        className={cn(
                          "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                          rec.is_active ? "text-green-500" : "text-gray-600"
                        )}
                      >
                        {rec.is_active ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                        {rec.is_active ? "Activa" : "Inactiva"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rec)}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRecurrenceToDelete(rec);
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                    No hay recurrencias creadas todavía.
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
          <div className="relative w-full max-w-lg h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {currentRecurrence.id ? "Editar" : "Nueva"} Recurrencia
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Cliente
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedVehicleId("");
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Vehículo
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  disabled={!selectedClientId}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none disabled:opacity-40"
                >
                  <option value="">
                    {selectedClientId ? "Seleccionar vehículo" : "Primero seleccioná un cliente"}
                  </option>
                  {filteredVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model}
                      {v.license_plate ? ` (${v.license_plate})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Servicio
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    const svc = services.find((s) => s.id === e.target.value);
                    setSelectedServiceId(e.target.value);
                    if (svc) {
                      setCurrentRecurrence({ ...currentRecurrence, duration_minutes: svc.duration_minutes });
                    }
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatDuration(s.duration_minutes)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Frecuencia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["daily", "weekly", "monthly"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() =>
                        setCurrentRecurrence({ ...currentRecurrence, frequency: freq })
                      }
                      className={cn(
                        "py-3 rounded-xl border text-sm font-bold transition-all",
                        currentRecurrence.frequency === freq
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                      )}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of Week (weekly) */}
              {currentRecurrence.frequency === "weekly" && (
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Día de la semana
                  </label>
                  <select
                    value={currentRecurrence.day_of_week ?? 1}
                    onChange={(e) =>
                      setCurrentRecurrence({
                        ...currentRecurrence,
                        day_of_week: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  >
                    {DAYS.map((day, i) => (
                      <option key={i} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day of Month (monthly) */}
              {currentRecurrence.frequency === "monthly" && (
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Día del mes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={currentRecurrence.day_of_month ?? 1}
                    onChange={(e) =>
                      setCurrentRecurrence({
                        ...currentRecurrence,
                        day_of_month: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
              )}

              {/* Time & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={currentRecurrence.time?.slice(0, 5) || "09:00"}
                    onChange={(e) =>
                      setCurrentRecurrence({ ...currentRecurrence, time: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={currentRecurrence.duration_minutes || 60}
                    onChange={(e) =>
                      setCurrentRecurrence({
                        ...currentRecurrence,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              {/* Start & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={currentRecurrence.start_date || ""}
                    onChange={(e) =>
                      setCurrentRecurrence({ ...currentRecurrence, start_date: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                    Fecha de fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={currentRecurrence.end_date || ""}
                    onChange={(e) =>
                      setCurrentRecurrence({
                        ...currentRecurrence,
                        end_date: e.target.value || null,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSave}
                  disabled={!selectedClientId || !selectedVehicleId || !selectedServiceId}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  Guardar Recurrencia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && recurrenceToDelete && (
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
              <h3 className="text-xl font-bold">Eliminar Recurrencia</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar la recurrencia de{" "}
              <span className="text-white font-bold">
                {recurrenceToDelete.client?.first_name} {recurrenceToDelete.client?.last_name}
              </span>{" "}
              para <span className="text-white font-bold">{recurrenceToDelete.service?.name}</span>?
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
