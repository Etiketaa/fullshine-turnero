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
  Car,
  Trash2,
  AlertTriangle,
  FileText,
  Package,
  Wrench,
  Star
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null);

  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; total: number }[]>([]);
  const [workOrderStatuses, setWorkOrderStatuses] = useState({ pending: 0, in_progress: 0, completed: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [appointmentsRes, clientCountRes, appCountRes, workOrdersRes, lowStockRes] = await Promise.all([
      supabase
        .from("appointments")
        .select(`
          *,
          client:clients(first_name, last_name, phone),
          service:services(name, price)
        `)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(20),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase
        .from("work_orders")
        .select(`
          id,
          status,
          total,
          client_id,
          client:clients(first_name, last_name),
          items:work_order_items(
            service_id,
            quantity,
            subtotal,
            service:services(name)
          )
        `),
      supabase
        .from("products")
        .select("id, name, stock, min_stock, category")
        .eq("is_active", true)
        .order("stock", { ascending: true }),
    ]);

    if (appointmentsRes.data) setUpcomingAppointments(appointmentsRes.data);

    const revenue = (workOrdersRes.data || [])
      .filter((wo) => wo.status === "completed")
      .reduce((sum, wo) => sum + (wo.total || 0), 0);

    setStats({
      totalClients: clientCountRes.count || 0,
      totalAppointments: appCountRes.count || 0,
      revenue,
    });

    // Work order statuses
    const statuses = { pending: 0, in_progress: 0, completed: 0 };
    (workOrdersRes.data || []).forEach((wo) => {
      if (wo.status in statuses) statuses[wo.status as keyof typeof statuses]++;
    });
    setWorkOrderStatuses(statuses);

    // Top services (from work_order_items)
    const serviceCount: Record<string, { name: string; count: number }> = {};
    (workOrdersRes.data || []).forEach((wo) => {
      (wo.items || []).forEach((item: any) => {
        const name = item.service?.name || "Desconocido";
        if (!serviceCount[item.service_id]) {
          serviceCount[item.service_id] = { name, count: 0 };
        }
        serviceCount[item.service_id].count += item.quantity || 1;
      });
    });
    const sortedServices = Object.values(serviceCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopServices(sortedServices);

    // Top clients (by total spend)
    const clientSpend: Record<string, { name: string; total: number }> = {};
    (workOrdersRes.data || []).forEach((wo) => {
      const client = Array.isArray(wo.client) ? wo.client[0] : wo.client;
      if (wo.client_id && client) {
        const name = `${client.first_name} ${client.last_name}`;
        if (!clientSpend[wo.client_id]) {
          clientSpend[wo.client_id] = { name, total: 0 };
        }
        clientSpend[wo.client_id].total += wo.total || 0;
      }
    });
    const sortedClients = Object.values(clientSpend)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    setTopClients(sortedClients);

    // Low stock products
    const lowStock = (lowStockRes.data || []).filter(
      (p) => p.stock <= p.min_stock
    );
    setLowStockProducts(lowStock);

    setLoading(false);
  }

  async function handleDeleteAppointment() {
    if (!appointmentToDelete) return;
    
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentToDelete.id);
    
    if (!error) {
      setIsDeleteModalOpen(false);
      setAppointmentToDelete(null);
      fetchData();
    } else {
      alert("Error al eliminar el turno.");
    }
  }

  const statCards = [
    { label: "Turnos Totales", value: stats.totalAppointments, icon: CalendarIcon, color: "text-red-500" },
    { label: "Clientes", value: stats.totalClients, icon: Users, color: "text-blue-500" },
    { label: "Ingresos Totales", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Bienvenido, Dueño</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Acá tenés un resumen de lo que está pasando en Fullshine.</p>
        </div>
        <div className="sm:text-right">
          <div className="text-xs sm:text-sm font-medium text-red-500 uppercase tracking-widest">Hoy es</div>
          <div className="text-base sm:text-lg font-bold">{format(new Date(), "eeee d 'de' MMMM", { locale: es })}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start">
              <div className={stat.color}>
                <stat.icon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Workshop Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl space-y-2">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium">Pendientes</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-yellow-500">{workOrderStatuses.pending}</div>
        </div>
        <div className="p-4 sm:p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-blue-500" />
            <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium">En Progreso</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-500">{workOrderStatuses.in_progress}</div>
        </div>
        <div className="p-4 sm:p-6 bg-green-500/5 border border-green-500/10 rounded-2xl space-y-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium">Completadas</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-500">{workOrderStatuses.completed}</div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Top Services */}
        <div className="p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-red-500" />
            <h2 className="text-lg sm:text-xl font-bold">Top 5 Servicios Populares</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topServices.length > 0 ? (
            <div className="space-y-3">
              {topServices.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-5">{idx + 1}.</span>
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">{service.count} {service.count === 1 ? "vez" : "veces"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de servicios todavía.</p>
          )}
        </div>

        {/* Top Clients */}
        <div className="p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-red-500" />
            <h2 className="text-lg sm:text-xl font-bold">Top 5 Mejores Clientes</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((client, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-5">{idx + 1}.</span>
                    <span className="font-medium">{client.name}</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">{formatCurrency(client.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de clientes todavía.</p>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 sm:p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg sm:text-xl font-bold">Alertas de Stock Bajo</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                <div>
                  <div className="font-medium text-sm">{product.name}</div>
                  {product.category && (
                    <div className="text-xs text-gray-500">{product.category}</div>
                  )}
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${product.stock === 0 ? "text-red-500" : "text-yellow-500"}`}>
                  {product.stock} / {product.min_stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">Próximos Turnos</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="p-3 sm:p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-3 sm:contents">
                    <div className="flex flex-col items-center justify-center h-12 w-12 sm:h-14 sm:w-14 bg-red-600/10 text-red-500 rounded-xl font-bold flex-shrink-0">
                      <span className="text-[10px] uppercase">{format(new Date(app.date), "EEE", { locale: es })}</span>
                      <span className="text-lg sm:text-xl leading-none">{format(new Date(app.date), "d")}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg truncate">{app.client.first_name} {app.client.last_name}</div>
                      <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span className="truncate">{app.service.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end sm:gap-6 sm:w-auto">
                    <div className="sm:text-right">
                      <div className="font-bold text-base sm:text-xl flex items-center gap-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        {app.time.slice(0, 5)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-widest">{app.client.phone}</div>
                    </div>

                    <button 
                      onClick={() => {
                        setAppointmentToDelete(app);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 sm:p-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                No hay turnos próximos programados.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <Link 
              href="/admin/work-orders"
              className="p-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all text-left flex items-center justify-between"
            >
              Nueva Orden de Trabajo
              <FileText className="w-5 h-5 flex-shrink-0" />
            </Link>
            <Link 
              href="/admin/services"
              className="p-4 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left flex items-center justify-between"
            >
              Gestionar Servicios
              <Car className="w-5 h-5 text-red-500 flex-shrink-0" />
            </Link>
            <Link 
              href="/admin/availability"
              className="p-4 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left flex items-center justify-between"
            >
              Bloquear Fecha
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
            </Link>
          </div>

          <div className="p-4 sm:p-6 bg-red-600/5 border border-red-600/10 rounded-2xl">
            <h3 className="font-bold text-red-500 mb-2 uppercase tracking-widest text-xs">Tip del día</h3>
            <p className="text-xs sm:text-sm text-gray-400">Recordá confirmar los turnos de mañana para reducir el ausentismo.</p>
          </div>
        </div>
      </div>

      {/* Delete Appointment Modal */}
      {isDeleteModalOpen && appointmentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold">Eliminar Turno</h3>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              ¿Estás seguro de que deseas eliminar el turno de <span className="text-white font-bold">{appointmentToDelete.client.first_name} {appointmentToDelete.client.last_name}</span> 
              {" "}para el <span className="text-white font-bold">{format(new Date(appointmentToDelete.date), "eeee d 'de' MMMM", { locale: es })}</span>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAppointment}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all text-sm sm:text-base"
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
