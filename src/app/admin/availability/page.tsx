"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, Plus, Trash2, AlertCircle } from "lucide-react";

const DAYS = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: schedData } = await supabase.from("schedules").select("*").order("day_of_week");
    const { data: blockData } = await supabase.from("blocks").select("*").order("date");
    
    if (schedData) setSchedules(schedData);
    if (blockData) setBlocks(blockData);
    setLoading(false);
  }

  async function updateSchedule(id: string, startTime: string, endTime: string, isActive: boolean) {
    const { error } = await supabase
      .from("schedules")
      .update({ start_time: startTime, end_time: endTime, is_active: isActive })
      .eq("id", id);
    
    if (!error) fetchData();
  }

  async function addBlock() {
    if (!newBlockDate) return;
    const { error } = await supabase
      .from("blocks")
      .insert({ date: newBlockDate, reason: newBlockReason });
    
    if (!error) {
      setNewBlockDate("");
      setNewBlockReason("");
      fetchData();
    }
  }

  async function deleteBlock(id: string) {
    const { error } = await supabase.from("blocks").delete().eq("id", id);
    if (!error) fetchData();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Disponibilidad</h1>
        <p className="text-gray-400 mt-1">Configurá tus horarios semanales y bloqueá fechas especiales.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Weekly Schedule */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Horarios Semanales</h2>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden text-sm">
            {DAYS.map((day, index) => {
              const schedule = schedules.find(s => s.day_of_week === index);
              return (
                <div key={day} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                  <div className="w-24 font-bold text-gray-300">{day}</div>
                  
                  {schedule ? (
                    <div className="flex items-center gap-4">
                      <input 
                        type="time" 
                        defaultValue={schedule.start_time.slice(0, 5)} 
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 focus:border-red-500"
                        onBlur={(e) => updateSchedule(schedule.id, e.target.value, schedule.end_time, schedule.is_active)}
                      />
                      <span className="text-gray-600">a</span>
                      <input 
                        type="time" 
                        defaultValue={schedule.end_time.slice(0, 5)} 
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 focus:border-red-500"
                        onBlur={(e) => updateSchedule(schedule.id, schedule.start_time, e.target.value, schedule.is_active)}
                      />
                      <button 
                        onClick={() => updateSchedule(schedule.id, schedule.start_time, schedule.end_time, !schedule.is_active)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${schedule.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                      >
                        {schedule.is_active ? 'Activo' : 'Cerrado'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-600 italic">No configurado</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Blocks */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Bloqueos de Fecha</h2>
          </div>

          {/* Add Block Form */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
            <h3 className="font-bold">Añadir bloqueo (Feriados/Vacaciones)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <input 
                type="date" 
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:border-red-500"
              />
              <input 
                type="text" 
                placeholder="Motivo (ej: Vacaciones)" 
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:border-red-500"
              />
            </div>
            <button 
              onClick={addBlock}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Añadir Bloqueo
            </button>
          </div>

          {/* Blocks List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {blocks.length > 0 ? (
              blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div>
                    <div className="font-bold">{format(new Date(block.date + "T00:00:00"), "d 'de' MMMM, yyyy", { locale: es })}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">{block.reason || "Sin motivo"}</div>
                  </div>
                  <button 
                    onClick={() => deleteBlock(block.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-600 bg-white/5 rounded-2xl border border-dashed border-white/10 italic">
                No hay fechas bloqueadas.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-2xl flex gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <p className="text-sm text-gray-400">
          Los horarios configurados aquí controlan los turnos que aparecen disponibles para los clientes en la página de reservas. 
          Los bloqueos de fecha eliminan completamente ese día de la agenda.
        </p>
      </div>
    </div>
  );
}
