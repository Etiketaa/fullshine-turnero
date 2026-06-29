"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Download
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type WorkOrder = {
  id: string;
  client_id: string;
  vehicle_id: string;
  status: "pending" | "in_progress" | "completed";
  total: number;
  discount: number;
  notes: string;
  created_at: string;
  completed_at: string | null;
  client?: {
    first_name: string;
    last_name: string;
  };
  vehicle?: {
    brand: string;
    model: string;
  };
  items?: WorkOrderItem[];
};

type WorkOrderItem = {
  id: string;
  work_order_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string;
  service?: {
    name: string;
  };
};

type Client = {
  id: string;
  first_name: string;
  last_name: string;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
};

export default function AdminWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);
  const [currentWorkOrder, setCurrentWorkOrder] = useState<Partial<WorkOrder>>({
    notes: "",
  });
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [currentItem, setCurrentItem] = useState<Partial<WorkOrderItem>>({
    quantity: 1,
    unit_price: 0,
    subtotal: 0,
    notes: "",
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const clientName = `${order.client?.first_name} ${order.client?.last_name}`.toLowerCase();
      const vehicleInfo = `${order.vehicle?.brand} ${order.vehicle?.model}`.toLowerCase();
      const search = searchTerm.toLowerCase();

      if (search && !clientName.includes(search) && !vehicleInfo.includes(search)) {
        return false;
      }

      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      const orderDate = new Date(order.created_at);
      if (dateFrom && orderDate < new Date(dateFrom)) {
        return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [workOrders, searchTerm, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchWorkOrders();
    fetchClients();
    fetchServices();
  }, []);

  async function fetchWorkOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select(`
        *,
        client:clients(first_name, last_name),
        vehicle:vehicles(brand, model),
        items:work_order_items(
          *,
          service:services(name)
        )
      `)
      .order("created_at", { ascending: false });
    
    if (data) setWorkOrders(data);
    setLoading(false);
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name")
      .order("first_name");
    
    if (data) setClients(data);
  }

  async function fetchVehicles(clientId: string) {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, brand, model")
      .eq("client_id", clientId)
      .order("brand");
    
    if (data) setVehicles(data);
  }

  async function fetchServices() {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("is_active", true)
      .order("name");
    
    if (data) setServices(data);
  }

  async function handleCreateWorkOrder() {
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .insert([{
          client_id: selectedClientId,
          vehicle_id: selectedVehicleId || null,
          notes: currentWorkOrder.notes,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setEditingWorkOrderId(data.id);
      fetchWorkOrders();
    } catch (error) {
      console.error("Error creating work order:", error);
      alert("Error al crear la orden de trabajo.");
    }
  }

  async function handleAddItem() {
    if (!editingWorkOrderId || !selectedServiceId) return;
    
    try {
      const service = services.find(s => s.id === selectedServiceId);
      if (!service) return;
      
      const subtotal = (currentItem.quantity || 1) * (currentItem.unit_price || service.price);
      
      const { error } = await supabase
        .from("work_order_items")
        .insert([{
          work_order_id: editingWorkOrderId,
          service_id: selectedServiceId,
          quantity: currentItem.quantity || 1,
          unit_price: currentItem.unit_price || service.price,
          subtotal,
          notes: currentItem.notes,
        }]);
      
      if (error) throw error;
      
      await updateWorkOrderTotal(editingWorkOrderId);
      
      setIsItemModalOpen(false);
      setSelectedServiceId("");
      setCurrentItem({ quantity: 1, unit_price: 0, subtotal: 0, notes: "" });
      fetchWorkOrders();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error al agregar el ítem.");
    }
  }

  async function updateWorkOrderTotal(workOrderId: string) {
    const { data: items } = await supabase
      .from("work_order_items")
      .select("subtotal")
      .eq("work_order_id", workOrderId);
    
    if (items) {
      const total = items.reduce((sum, item) => sum + item.subtotal, 0);
      await supabase
        .from("work_orders")
        .update({ total })
        .eq("id", workOrderId);
    }
  }

  async function handleCompleteWorkOrder(workOrderId: string) {
    const { error } = await supabase
      .from("work_orders")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", workOrderId);
    
    if (!error) fetchWorkOrders();
  }

  async function handleDelete() {
    if (!workOrderToDelete) return;
    
    const { error } = await supabase
      .from("work_orders")
      .delete()
      .eq("id", workOrderToDelete.id);
    
    if (!error) {
      setIsDeleteModalOpen(false);
      setWorkOrderToDelete(null);
      fetchWorkOrders();
    } else {
      alert("Error al eliminar la orden de trabajo.");
    }
  }

  async function handleDeleteItem(itemId: string) {
    const { error } = await supabase
      .from("work_order_items")
      .delete()
      .eq("id", itemId);
    
    if (!error && editingWorkOrderId) {
      await updateWorkOrderTotal(editingWorkOrderId);
      fetchWorkOrders();
    }
  }

  function generateInvoice(order: WorkOrder) {
    const shortId = order.id.slice(0, 8).toUpperCase();
    const date = format(new Date(order.completed_at || order.created_at), "dd/MM/yyyy", { locale: es });
    const items = order.items || [];
    const servicesTable = items.map(item => `
      <tr>
        <td>${item.service?.name || "Servicio"}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.unit_price)}</td>
        <td class="text-right">${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Factura - ${shortId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
  .header { text-align: center; border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; color: #dc2626; margin-bottom: 4px; }
  .header p { color: #666; font-size: 14px; }
  .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .invoice-info div { font-size: 14px; }
  .invoice-info strong { display: block; color: #666; margin-bottom: 2px; }
  .client-info { margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
  .client-info h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
  .client-info p { font-size: 15px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #dc2626; color: white; text-align: left; padding: 10px 12px; font-size: 13px; }
  th:nth-child(2), td:nth-child(2) { text-align: center; }
  th:nth-child(3), td:nth-child(3),
  th:nth-child(4), td:nth-child(4) { text-align: right; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
  tr:nth-child(even) td { background: #fafafa; }
  .total-section { text-align: right; margin-bottom: 40px; }
  .total-section .total { font-size: 22px; font-weight: bold; color: #dc2626; border-top: 2px solid #333; padding-top: 10px; display: inline-block; }
  .footer { text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee; padding-top: 20px; }
  @media print {
    body { padding: 0; }
    .header { border-bottom-color: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th { background: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr:nth-child(even) td { background: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>FullShine Detailing</h1>
    <p>Servicio de Detailing Profesional</p>
  </div>
  <div class="invoice-info">
    <div>
      <strong>Factura N°</strong>
      #${shortId}
    </div>
    <div>
      <strong>Fecha</strong>
      ${date}
    </div>
  </div>
  <div class="client-info">
    <h3>Cliente</h3>
    <p><strong>${order.client?.first_name || ""} ${order.client?.last_name || ""}</strong></p>
    ${order.vehicle ? `<p>${order.vehicle.brand} ${order.vehicle.model}</p>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>Servicio</th>
        <th>Cant.</th>
        <th>Precio Unit.</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${servicesTable}
    </tbody>
  </table>
  <div class="total-section">
    <div class="total">Total: ${formatCurrency(order.total)}</div>
  </div>
  <div class="footer">
    <p>Gracias por su preferencia</p>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  function exportToCSV(data: WorkOrder[], filename: string) {
    const headers = ["ID", "Cliente", "Vehículo", "Estado", "Total", "Fecha"];
    const rows = data.map((order) => [
      order.id,
      `${order.client?.first_name || ""} ${order.client?.last_name || ""}`.trim(),
      `${order.vehicle?.brand || ""} ${order.vehicle?.model || ""}`.trim(),
      getStatusLabel(order.status),
      order.total?.toString() || "0",
      format(new Date(order.created_at), "dd/MM/yyyy"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500";
      case "in_progress": return "bg-blue-500/10 text-blue-500";
      case "completed": return "bg-green-500/10 text-green-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "in_progress": return "En Progreso";
      case "completed": return "Completada";
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-gray-400">Gestioná las órdenes de trabajo del taller.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentWorkOrder({ notes: "" });
            setSelectedClientId("");
            setSelectedVehicleId("");
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Orden
        </button>
        <button 
          onClick={() => exportToCSV(filteredWorkOrders, `ordenes_trabajo_${format(new Date(), "yyyy-MM-dd")}.csv`)}
          disabled={filteredWorkOrders.length === 0}
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por cliente o vehículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completadas</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
          />
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : filteredWorkOrders.length > 0 ? (
          filteredWorkOrders.map((order) => (
            <div key={order.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-600/10 rounded-xl">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">
                      {order.client?.first_name} {order.client?.last_name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {order.vehicle?.brand} {order.vehicle?.model} • {format(new Date(order.created_at), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getStatusColor(order.status))}>
                    {getStatusLabel(order.status)}
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatCurrency(order.total)}</div>
                    {order.discount > 0 && (
                      <div className="text-xs text-green-500">-{formatCurrency(order.discount)} descuento</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{item.quantity}x</span>
                          <span>{item.service?.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">{formatCurrency(item.unit_price)}</span>
                          <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                          {order.status !== "completed" && (
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  {order.status !== "completed" && (
                    <>
                      <button 
                        onClick={() => {
                          setEditingWorkOrderId(order.id);
                          setIsItemModalOpen(true);
                        }}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-all"
                      >
                        Agregar Ítem
                      </button>
                      <button 
                        onClick={() => handleCompleteWorkOrder(order.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-500 transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Completar
                      </button>
                    </>
                  )}
                  {order.status === "completed" && (
                    <button 
                      onClick={() => generateInvoice(order)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500 transition-all flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Generar Factura
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setWorkOrderToDelete(order);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
            {workOrders.length > 0 ? "No se encontraron órdenes con los filtros aplicados." : "No hay órdenes de trabajo creadas todavía."}
          </div>
        )}
      </div>

      {/* Create Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Nueva Orden de Trabajo</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    fetchVehicles(e.target.value);
                  }}
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

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Vehículo (Opcional)</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  disabled={!selectedClientId}
                >
                  <option value="">Seleccionar vehículo</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Notas</label>
                <textarea 
                  rows={3}
                  value={currentWorkOrder.notes}
                  onChange={(e) => setCurrentWorkOrder({...currentWorkOrder, notes: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles de la orden..."
                />
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleCreateWorkOrder}
                  disabled={!selectedClientId}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  Crear Orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsItemModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Agregar Ítem</h2>
              <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Servicio</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const service = services.find(s => s.id === e.target.value);
                    if (service) {
                      setCurrentItem({...currentItem, unit_price: service.price});
                    }
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Cantidad</label>
                  <input 
                    type="number" 
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Precio Unitario</label>
                  <input 
                    type="number" 
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem({...currentItem, unit_price: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Notas</label>
                <textarea 
                  rows={2}
                  value={currentItem.notes}
                  onChange={(e) => setCurrentItem({...currentItem, notes: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles del ítem..."
                />
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="font-bold">{formatCurrency((currentItem.quantity || 1) * (currentItem.unit_price || 0))}</span>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleAddItem}
                  disabled={!selectedServiceId}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  Agregar Ítem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && workOrderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Eliminar Orden</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar esta orden de trabajo? 
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
