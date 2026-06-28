import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-red-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            FULL<span className="text-red-500">SHINE</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
            <Link href="#servicios" className="hover:text-red-400 transition-colors">Servicios</Link>
            <Link href="#nosotros" className="hover:text-red-400 transition-colors">Nosotros</Link>
            <Link href="/booking" className="px-6 py-2 bg-red-600 text-white hover:bg-red-500 transition-all rounded-full font-bold">
              Reservar
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-[url('https://images.unsplash.com/photo-1601362840469-57e2b5b6ce6e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50" />
          
          <div className="container mx-auto px-6 relative z-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-12 bg-red-500" />
                <span className="text-red-500 uppercase tracking-[0.3em] text-sm font-semibold">Car Detailing</span>
              </div>
              <h1 className="text-7xl md:text-8xl font-bold leading-none mb-8 tracking-tighter">
                Tu auto<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-700">brilla</span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">
                Servicios premium de detailing automotriz. 
                Lavado, pulido, ceramic coating y más para que tu vehículo luzca impecable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/booking" className="px-10 py-4 bg-red-600 text-white hover:bg-red-500 transition-all rounded-full font-bold text-center group flex items-center justify-center gap-2">
                  Reservar Turno
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="https://wa.me/5492915275183" target="_blank" className="px-10 py-4 border border-white/20 hover:border-red-500 transition-all rounded-full font-bold text-center flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5 text-red-500" />
                  WhatsApp
                </a>
              </div>

              <div className="mt-16 flex gap-12 border-t border-white/10 pt-10">
                <div>
                  <div className="text-3xl font-bold text-red-500">+5</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500">Años de Exp.</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-500">100%</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500">Garantizado</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-500">⭐</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500">Premium</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Categories */}
        <section id="servicios" className="py-32 bg-zinc-950">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-red-500 uppercase tracking-widest text-sm font-semibold">Lo que hacemos</span>
              <h2 className="text-5xl font-bold mt-4">Nuestros Servicios</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Category: Exterior */}
              <div className="group relative h-[500px] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1520340356584-f9917d4ced6a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
                  <h3 className="text-4xl font-bold mb-4">Exterior</h3>
                  <p className="text-gray-300 mb-6 max-w-sm">Lavado, pulido, ceramic coating y descontaminación de pintura.</p>
                  <Link href="/booking?category=Exterior" className="text-red-500 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Ver Disponibilidad <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Category: Interior */}
              <div className="group relative h-[500px] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
                  <h3 className="text-4xl font-bold mb-4">Interior</h3>
                  <p className="text-gray-300 mb-6 max-w-sm">Limpieza profunda de tapizados, desinfección y tratamiento de cuero.</p>
                  <Link href="/booking?category=Interior" className="text-red-500 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Ver Disponibilidad <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Category: Completo */}
              <div className="group relative h-[500px] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
                  <h3 className="text-4xl font-bold mb-4">Completo</h3>
                  <p className="text-gray-300 mb-6 max-w-sm">El paquete total para tu auto: interior + exterior + protección cerámica.</p>
                  <Link href="/booking?category=Completo" className="text-red-500 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Ver Disponibilidad <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-600/10 z-0" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-6xl font-bold mb-8">¿Listo para brillar?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Elegí el servicio, el día y el horario que mejor te quede. Reservá en segundos y recibí confirmación por email.
            </p>
            <Link href="/booking" className="px-12 py-6 bg-white text-black hover:bg-red-500 transition-all rounded-full font-bold text-xl inline-block">
              Reservar Ahora
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-bold">FULL<span className="text-red-500">SHINE</span></div>
          <div className="flex gap-8 text-gray-500 text-sm uppercase tracking-widest">
            <a href="#" className="hover:text-red-500 transition-colors">Instagram</a>
            <a href="https://wa.me/5492915275183" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">WhatsApp</a>
          </div>
          <div className="text-gray-600 text-xs">
            © 2024 FULLSHINE CAR DETAILING. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5492915275183"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 p-4 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/30 hover:scale-110 active:scale-95 transition-all group"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
          ¿Tenés alguna duda?
        </span>
      </a>
    </div>
  );
}
