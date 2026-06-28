"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  X,
  Car
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalClients: 0,
    revenue: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          *,
          client:clients(first_name, last_name, phone),
          service:services(name, price)
        `)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(20);

      if (appointments) setUpcomingAppointments(appointments);

      const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true });
      const { count: appCount } = await supabase.from("appointments").select("*", { count: "exact", head: true });
      
      setStats({
        totalClients: clientCount || 0,
        totalAppointments: appCount || 0,
        revenue: 450000,
      });

      setLoading(false);
    }
    fetchData();
  }, []);

  const statCards = [
    { label: "Turnos Totales", value: stats.totalAppointments, icon: CalendarIcon, color: "text-red-500" },
    { label: "Clientes", value: stats.totalClients, icon: Users, color: "text-blue-500" },
    { label: "Ingresos Estimados", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Bienvenido, Dueño</h1>
          <p className="text-gray-400 mt-1">Acá tenés un resumen de lo que está pasando en Fullshine.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-red-500 uppercase tracking-widest">Hoy es</div>
          <div className="text-lg font-bold">{format(new Date(), "eeee d 'de' MMMM", { locale: es })}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className={stat.color}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Próximos Turnos</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-6 group hover:bg-white/[0.08] transition-all">
                  <div className="flex flex-col items-center justify-center h-14 w-14 bg-red-600/10 text-red-500 rounded-xl font-bold">
                    <span className="text-[10px] uppercase">{format(new Date(app.date), "EEE", { locale: es })}</span>
                    <span className="text-xl leading-none">{format(new Date(app.date), "d")}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-lg">{app.client.first_name} {app.client.last_name}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                      {app.service.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xl flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      {app.time.slice(0, 5)}
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">{app.client.phone}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                No hay turnos próximos programados.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Acciones Rápidas</h2>
          <div className="grid gap-3">
            <button className="p-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all text-left flex items-center justify-between">
              Nuevo Turno Manual
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button className="p-4 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left flex items-center justify-between">
              Gestionar Servicios
              <Car className="w-5 h-5 text-red-500" />
            </button>
            <button className="p-4 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left flex items-center justify-between">
              Bloquear Fecha
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>

          <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-2xl">
            <h3 className="font-bold text-red-500 mb-2 uppercase tracking-widest text-xs">Tip del día</h3>
            <p className="text-sm text-gray-400">Recordá confirmar los turnos de mañana para reducir el ausentismo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
