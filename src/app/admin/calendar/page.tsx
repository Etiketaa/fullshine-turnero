"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  X,
  Calendar,
  Check,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";

type Appointment = {
  id: string;
  client_id: string;
  vehicle_id: string | null;
  service_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string;
  created_at: string;
  client?: { first_name: string; last_name: string };
  service?: { name: string; price: number; duration_minutes: number };
};

type Client = { id: string; first_name: string; last_name: string };
type Service = { id: string; name: string; price: number; duration_minutes: number };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [newClientId, setNewClientId] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchClients();
    fetchServices();
  }, [currentDate]);

  async function fetchAppointments() {
    setLoading(true);
    const monthStart = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentDate), "yyyy-MM-dd");

    const { data } = await supabase
      .from("appointments")
      .select("*, client:clients(first_name, last_name), service:services(name, price, duration_minutes)")
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("time");

    if (data) setAppointments(data);
    setLoading(false);
  }

  async function fetchClients() {
    const { data } = await supabase
      .from("clients")
      .select("id, first_name, last_name")
      .order("first_name");
    if (data) setClients(data);
  }

  async function fetchServices() {
    const { data } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("is_active", true)
      .order("name");
    if (data) setServices(data);
  }

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);
    return { days, startPadding };
  }, [currentDate]);

  function getAppointmentsForDay(day: Date): Appointment[] {
    return appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), day));
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day);
    setDayModalOpen(true);
  }

  function handleCreateClick(day: Date) {
    setCreateDate(day);
    setNewClientId("");
    setNewServiceId("");
    setNewTime("09:00");
    setNewNotes("");
    setCreateModalOpen(true);
  }

  async function handleCreateAppointment() {
    if (!createDate || !newClientId || !newServiceId) return;
    setSaving(true);

    const selectedService = services.find((s) => s.id === newServiceId);

    const { error } = await supabase.from("appointments").insert([
      {
        client_id: newClientId,
        service_id: newServiceId,
        date: format(createDate, "yyyy-MM-dd"),
        time: newTime,
        duration_minutes: selectedService?.duration_minutes || 60,
        notes: newNotes,
        status: "pending",
      },
    ]);

    setSaving(false);

    if (!error) {
      setCreateModalOpen(false);
      fetchAppointments();
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    completed: "Completado",
  };

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-gray-400">Vista mensual de turnos y citas.</p>
        </div>
        <button
          onClick={() => handleCreateClick(new Date())}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Crear Turno
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs uppercase font-bold tracking-widest text-gray-500 py-4"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for padding */}
          {Array.from({ length: calendarDays.startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[120px] border-b border-r border-white/5 bg-white/[0.01]" />
          ))}

          {/* Day cells */}
          {calendarDays.days.map((day) => {
            const dayAppts = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            const previewAppts = dayAppts.slice(0, 2);
            const extraCount = dayAppts.length - 2;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] border-b border-r border-white/5 p-2 transition-all hover:bg-white/[0.03] group cursor-pointer",
                  dayAppts.length > 0 && "bg-red-500/[0.02]"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg",
                      isToday && "bg-red-600 text-white",
                      !isToday && dayAppts.length > 0 && "text-red-400",
                      !isToday && dayAppts.length === 0 && "text-gray-400"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateClick(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>

                <div className="space-y-1">
                  {previewAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold truncate border",
                        statusColors[appt.status] || "bg-white/5 text-gray-400 border-white/10"
                      )}
                    >
                      <span className="truncate block">{appt.time.slice(0, 5)} {appt.client?.first_name}</span>
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <div className="text-[10px] text-gray-500 font-bold pl-2">
                      +{extraCount} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {dayModalOpen && selectedDay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDayModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {getAppointmentsForDay(selectedDay).length} turno(s) programado(s)
                </p>
              </div>
              <button
                onClick={() => setDayModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {getAppointmentsForDay(selectedDay).length > 0 ? (
                getAppointmentsForDay(selectedDay).map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 hover:border-red-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/10 rounded-lg">
                          <Clock className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="font-bold text-lg">
                          {appt.time.slice(0, 5)} hs
                        </span>
                      </div>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                          statusColors[appt.status]
                        )}
                      >
                        {statusLabels[appt.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <User className="w-4 h-4 text-red-500/50" />
                      {appt.client?.first_name} {appt.client?.last_name}
                    </div>

                    {appt.service && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-gray-400">
                          <Calendar className="w-4 h-4 text-red-500/50" />
                          {appt.service.name}
                        </div>
                        <span className="font-bold text-red-500">
                          {formatCurrency(appt.service.price)}
                        </span>
                      </div>
                    )}

                    {appt.notes && (
                      <p className="text-xs text-gray-500 italic border-t border-white/5 pt-2 mt-2">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  No hay turnos para este día.
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setDayModalOpen(false);
                  handleCreateClick(selectedDay);
                }}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {createModalOpen && createDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Nuevo Turno</h2>
                <p className="text-gray-400 text-sm mt-1 capitalize">
                  {format(createDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Cliente
                </label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
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

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Servicio
                </label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Hora
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles del turno..."
                />
              </div>

              <div className="pt-6">
                <button
                  onClick={handleCreateAppointment}
                  disabled={!newClientId || !newServiceId || saving}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  {saving ? "Guardando..." : "Crear Turno"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


