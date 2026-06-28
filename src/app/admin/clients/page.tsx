"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Mail, 
  Phone, 
  Download,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        <button 
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-sm"
        >
          <Download className="w-4 h-4 text-red-500" />
          Exportar CSV
        </button>
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
                <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">
                  Desde {format(new Date(client.created_at), "MMM yyyy", { locale: es })}
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
    </div>
  );
}
