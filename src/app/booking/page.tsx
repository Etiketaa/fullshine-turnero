"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, isSameDay, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import { processBookingAction } from "@/app/actions";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, CheckCircle2, Car, AlertTriangle, X } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  price: number;
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492915275183";

  // State
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedForModal, setSelectedForModal] = useState<Service | null>(null);

  // Fetch services
  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (data) setServices(data);
      setLoading(false);
    }
    fetchServices();
  }, []);

  // Calculate available slots when date or service changes
  useEffect(() => {
    if (selectedService && selectedDate) {
      generateSlots(selectedDate, setAvailableSlots);
    }
  }, [selectedService, selectedDate]);

  const generateSlots = async (date: Date, setter: (slots: string[]) => void) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, "yyyy-MM-dd");

    // Check for blocks
    const { data: blocks } = await supabase
      .from("blocks")
      .select("*")
      .eq("date", dateStr);

    if (blocks && blocks.length > 0) {
      setter([]);
      return;
    }

    // Get schedule
    const { data: schedule } = await supabase
      .from("schedules")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    if (!schedule) {
      setter([]);
      return;
    }

    // Generate intervals (every 60 mins for simplicity)
    const slots: string[] = [];
    let current = schedule.start_time;
    const end = schedule.end_time;

    while (current < end) {
      slots.push(current.slice(0, 5));
      const [h, m] = current.split(":").map(Number);
      const nextH = h + Math.floor((m + 60) / 60);
      const nextM = (m + 60) % 60;
      current = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}:00`;
    }

    setter(slots);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDuplicateWarning(null);

    try {
      // Check for duplicate appointment
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", formData.email)
        .single();

      if (existingClient) {
        const { data: existingAppointment } = await supabase
          .from("appointments")
          .select("id")
          .eq("client_id", existingClient.id)
          .eq("service_id", selectedService?.id)
          .eq("date", format(selectedDate, "yyyy-MM-dd"))
          .neq("status", "cancelled")
          .single();

        if (existingAppointment) {
          setDuplicateWarning("Ya tenés un turno reservado para este servicio en esta fecha. Si necesitás otro turno, por favor contactanos por WhatsApp.");
          setIsSubmitting(false);
          return;
        }
      }

      // 1. Create/Update Client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .upsert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        }, { onConflict: "email" })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Create Appointment
      const { error: appError } = await supabase
        .from("appointments")
        .insert({
          client_id: clientData.id,
          service_id: selectedService?.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes: formData.notes,
        });

      if (appError) throw appError;

      // 3. Prepare WhatsApp Message
      const message = `¡Hola! Soy *${formData.firstName} ${formData.lastName}*. 
Quisiera confirmar mi turno para:
🚗 *Servicio:* ${selectedService?.name}
📅 *Fecha:* ${format(selectedDate, "eeee d 'de' MMMM", { locale: es })}
⏰ *Hora:* ${selectedTime} hs
${formData.notes ? `📝 *Notas:* ${formData.notes}` : ""}
📱 *Teléfono:* ${formData.phone}

_Enviado desde el sistema de reservas de Fullshine Car Detailing_`;

      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      setWhatsappUrl(url);

      // 4. Send Email via Server Action (non-blocking)
      processBookingAction({
        email: formData.email,
        name: formData.firstName,
        date: format(selectedDate, "eeee d 'de' MMMM", { locale: es }),
        time: selectedTime!,
        service: selectedService?.name || "Servicio",
      }).catch((err) => console.error("Email failed (non-critical):", err));

      setSuccess(true);
      
      // Auto redirect to WhatsApp after a short delay
      setTimeout(() => {
        window.location.href = url;
      }, 1500);
    } catch (error) {
      console.error("Error booking:", error);
      alert("Hubo un error al procesar tu reserva. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-red-500 mx-auto" />
          <h1 className="text-4xl font-bold tracking-tighter">¡Reserva Registrada!</h1>
          <p className="text-gray-400">
            Hemos guardado tu turno correctamente. Para finalizar la confirmación, por favor enviá los detalles a nuestro WhatsApp.
          </p>
          <div className="space-y-3">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Enviar a WhatsApp
            </a>
            <button 
              onClick={() => router.push("/")}
              className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            FULL<span className="text-red-500">SHINE</span>
          </Link>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-gray-500">
            <span className={cn(step >= 1 ? "text-red-500 font-bold" : "")}>Servicio</span>
            <ChevronRight className="w-3 h-3" />
            <span className={cn(step >= 2 ? "text-red-500 font-bold" : "")}>Fecha</span>
            <ChevronRight className="w-3 h-3" />
            <span className={cn(step >= 3 ? "text-red-500 font-bold" : "")}>Datos</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Elegí tu servicio</h2>
              <p className="text-gray-400">Seleccioná el tratamiento que deseas para tu vehículo.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : (
                services.map((service, index) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedForModal(service);
                      setServiceModalOpen(true);
                    }}
                    className={cn(
                      "text-left p-6 rounded-2xl border transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/10",
                      selectedService?.id === service.id
                        ? "bg-red-600 border-red-500 text-white scale-[1.02] shadow-xl shadow-red-500/20"
                        : "bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-white/[0.08]"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold",
                        selectedService?.id === service.id ? "bg-white/20" : "bg-red-500/20 text-red-500"
                      )}>
                        {service.category}
                      </span>
                      <span className="font-bold">{formatCurrency(service.price)}</span>
                    </div>
                    <h3 className="text-xl font-bold group-hover:translate-x-1 transition-transform">{service.name}</h3>
                    <p className={cn(
                      "text-sm mt-1 line-clamp-2",
                      selectedService?.id === service.id ? "text-white/70" : "text-gray-400"
                    )}>
                      {service.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration_minutes} min
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a servicios
            </button>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">¿Cuándo venís?</h2>
                  <p className="text-gray-400">Seleccioná el día para tu cita.</p>
                </div>
                
                {/* Simplified Calendar */}
                <div className="grid grid-cols-7 gap-2">
                  {Array(21).fill(0).map((_, i) => {
                    const date = addDays(startOfToday(), i + 1);
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all",
                          isSelected 
                            ? "bg-red-600 text-white font-bold scale-105 shadow-lg shadow-red-500/20" 
                            : "bg-white/5 border border-white/5 hover:border-red-500/30"
                        )}
                      >
                        <span className="text-[10px] uppercase opacity-60">{format(date, "EEE", { locale: es })}</span>
                        <span className="text-lg">{format(date, "d")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    Horarios disponibles
                  </h3>
                  <p className="text-sm text-gray-400">Para el {format(selectedDate, "eeee d 'de' MMMM", { locale: es })}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-105",
                          selectedTime === time
                            ? "bg-red-600 border-red-500 text-white font-bold scale-105 shadow-lg shadow-red-500/25"
                            : "bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-white/10"
                        )}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      No hay horarios disponibles para este día.
                    </div>
                  )}
                </div>

                {selectedTime && (
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 mt-8"
                  >
                    Siguiente paso
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 3 && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <button 
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a horarios
            </button>

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tus datos</h2>
                <p className="text-gray-400">Completá la información para confirmar la reserva.</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Nombre</label>
                    <input
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="Ej: Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Apellido</label>
                    <input
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="Ej: Pérez"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="juan.perez@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">WhatsApp / Teléfono</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Ej: +54 9 11 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Notas (Opcional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors resize-none"
                    placeholder="Ej: Modelo del auto, color, observaciones..."
                  />
                </div>

                <div className="pt-6 border-t border-white/5 mt-8 space-y-6">
                  <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-lg">Resumen del turno</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Car className="w-4 h-4 text-red-500" />
                        <span>{selectedService?.name}</span>
                        <span className="ml-auto font-bold">{formatCurrency(selectedService?.price || 0)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarIcon className="w-4 h-4 text-red-500" />
                        <span>{format(selectedDate, "eeee d 'de' MMMM", { locale: es })} a las {selectedTime} hs</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span>Duración: {selectedService?.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>

                  {duplicateWarning && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-500">{duplicateWarning}</p>
                    </div>
                  )}

                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl shadow-red-500/20"
                  >
                    {isSubmitting ? "Procesando..." : "Confirmar Reserva"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Service Info Modal */}
      {serviceModalOpen && selectedForModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setServiceModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <span className="px-3 py-1 rounded-lg text-xs uppercase tracking-widest font-bold bg-red-500/20 text-red-500">
                {selectedForModal.category}
              </span>
              <button onClick={() => setServiceModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">{selectedForModal.name}</h2>
              <p className="text-gray-400 leading-relaxed">{selectedForModal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl space-y-1">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Precio</div>
                <div className="text-2xl font-bold text-red-500">{formatCurrency(selectedForModal.price)}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl space-y-1">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Duración</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  {selectedForModal.duration_minutes} min
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setServiceModalOpen(false)}
                className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
              >
                Volver
              </button>
              <button 
                onClick={() => {
                  setSelectedService(selectedForModal);
                  setServiceModalOpen(false);
                  setStep(2);
                }}
                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
              >
                Reservar
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500 font-bold tracking-widest animate-pulse">CARGANDO...</div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
