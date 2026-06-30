"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { MessageCircle, ArrowRight, ChevronDown, X } from "lucide-react";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";

type ServiceVariant = {
  name: string;
  description: string;
  years?: number;
};

type Service = {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  image: string;
  category: string;
  variants?: ServiceVariant[];
};

type Category = {
  id: string;
  label: string;
  num: string;
  desc: string;
  services: Service[];
};

const categories: Category[] = [
  {
    id: "exterior",
    label: "Exterior",
    num: "01",
    desc: "Cuidado completo del exterior de tu vehículo.",
    services: [
      {
        id: "lavado-premium",
        name: "Lavado Premium",
        shortDesc: "Lavado exterior detallado con productos de alta gama.",
        fullDesc: "Lavado exterior completo con técnicas de dos cubetas, shampoo pH neutro, descontaminación con arcilla, secado con toallas de microfibra y protección de pintura. Incluye limpieza de llantas, caucho y aplicación de quick detailer.",
        image: "https://images.unsplash.com/photo-1520340356584-f9917d4ced6a?q=80&w=1200&auto=format&fit=crop",
        category: "Exterior",
      },
      {
        id: "pulido-abrillantado",
        name: "Pulido Abrillantado",
        shortDesc: "Pulido de pintura para eliminar microarañazos.",
        fullDesc: "Pulido de pintura en máquina rotativa y orbital para eliminar microarañazos, marcas de agua y swirl marks. Recupera el brillo profundo y la profundidad del color de tu vehículo. Incluye descontaminación previa y protección final.",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
        category: "Exterior",
      },
      {
        id: "restauracion-opticas",
        name: "Restauración de Ópticas",
        shortDesc: "Restauración y pulido de faros opacos.",
        fullDesc: "Restauración completa de faros y ópticas opacadas por el paso del tiempo y la radiación UV. Proceso de lijado progresivo, pulido y sellado con protección UV para mantener la transparencia por más tiempo.",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afe?q=80&w=1200&auto=format&fit=crop",
        category: "Exterior",
      },
      {
        id: "limpieza-motor",
        name: "Limpieza de Motor",
        shortDesc: "Limpieza profunda del compartimento del motor.",
        fullDesc: "Limpieza profunda del compartimento del motor con productos desengrasantes especializados. Remoción de suciedad, grasa y residuos. Incluye protección de componentes electrónicos y aplicación de dressing para un acabado como nuevo.",
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop",
        category: "Exterior",
      },
    ],
  },
  {
    id: "interior",
    label: "Interior",
    num: "02",
    desc: "Limpieza profunda y desinfección del habitáculo.",
    services: [
      {
        id: "interior-full",
        name: "Interior Full",
        shortDesc: "Limpieza profunda de tapizados, cuero y plásticos.",
        fullDesc: "Limpieza integral del interior del vehículo. Incluye aspirado profundo, lavado de tapizados con extractor de agua, limpieza de cuero con acondicionador, tratamiento de plásticos, limpieza de vidrios interiores, desinfección por ozono y aroma final.",
        image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
        category: "Interior",
      },
    ],
  },
  {
    id: "tratamientos",
    label: "Tratamientos",
    num: "03",
    desc: "Protecciones de larga duración para la pintura.",
    services: [
      {
        id: "tratamiento-acrilico",
        name: "Tratamiento Acrílico",
        shortDesc: "Protección acrílica de larga duración que brilla.",
        fullDesc: "Aplicación de sellado acrílico de alta duración que aporta brillo profundo, hidrofobicidad y protección contra rayos UV, aguas ácidas y contaminación. Ideal para quienes buscan un balance entre protección y mantenimiento sencillo.",
        image: "https://images.unsplash.com/photo-1601973578257-045786d02b3f?q=80&w=1200&auto=format&fit=crop",
        category: "Tratamientos",
      },
      {
        id: "tratamiento-ceramico",
        name: "Tratamiento Cerámico",
        shortDesc: "Ceramic coating profesional con protección duradera.",
        fullDesc: "Aplicación de recubrimiento cerámico profesional que crea una capa protectora permanente sobre la pintura. Protege contra rayones químicos, radiación UV, aguas ácidas y contaminación ambiental. Aporta un brillo espejo y facilidad de lavado.",
        image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
        category: "Tratamientos",
        variants: [
          { name: "Sellado 1 año", description: "Protección cerámica con duración de 1 año. Incluye preparación de pintura y aplicación de base.", years: 1 },
          { name: "Sellado 2 años", description: "Protección cerámica con duración de 2 años. Incluye preparación de pintura, base y capa superior.", years: 2 },
          { name: "Sellado 3 años", description: "Protección cerámica con duración de 3 años. Incluye preparación completa, multi-capa y garantía extendida.", years: 3 },
        ],
      },
    ],
  },
];

const ctaClasses = "inline-flex items-center gap-2 px-7 py-3.5 text-[13px] font-medium tracking-[0.06em] uppercase rounded-[2px] bg-gradient-to-br from-[var(--silver)] via-[var(--silver-2)] to-[var(--silver-3)] text-[#1a1a1a] hover:shadow-[0_4px_24px_rgba(200,200,200,0.3)] hover:-translate-y-px transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] whitespace-nowrap";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setOpenCategory((prev) => (prev === id ? null : id));
  }, []);

  const openModal = useCallback((service: Service) => {
    setSelectedService(service);
    setSelectedVariant(service.variants ? service.variants[0] : null);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setSelectedService(null);
    setSelectedVariant(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeModal]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 transition-all duration-300 ${
          scrolled
            ? "py-3 md:py-3.5 bg-[rgba(12,12,12,0.92)] backdrop-blur-md border-b border-[var(--border)]"
            : "py-5 md:py-6 bg-gradient-to-b from-[rgba(12,12,12,0.9)] to-transparent border-b border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/img/logo.svg"
            alt="Fullshine Car Detailing"
            width={65}
            height={65}
            className="group-hover:opacity-80 transition-opacity duration-500"
          />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-[var(--font-oswald)] text-lg font-semibold tracking-[0.08em] text-white">
              FULLSHINE
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)]">
              Car Detailing
            </span>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-9">
          <a href="#servicios" className="text-[13px] tracking-[0.08em] uppercase text-[var(--text-dim)] hover:text-[var(--red-2)] transition-colors duration-500 ease-out relative after:content-[''] after:absolute after:left-0 after:bottom-[-6px] after:w-0 after:h-px after:bg-[var(--red)] after:transition-[width] after:duration-500 after:ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:after:w-full">
            Servicios
          </a>
          <a href="#nosotros" className="text-[13px] tracking-[0.08em] uppercase text-[var(--text-dim)] hover:text-[var(--red-2)] transition-colors duration-500 ease-out relative after:content-[''] after:absolute after:left-0 after:bottom-[-6px] after:w-0 after:h-px after:bg-[var(--red)] after:transition-[width] after:duration-500 after:ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:after:w-full">
            Por qué elegirnos
          </a>
          <Link href="/booking" className={ctaClasses}>
            Reservar turno
          </Link>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section id="hero" className="relative min-h-screen flex items-center bg-[length:cover] bg-[radial-gradient(ellipse_at_70%_30%,rgba(200,30,30,0.06),transparent_60%)]">
          <div
            className="absolute inset-0 opacity-40 z-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2070&auto=format&fit=crop')",
              backgroundSize: "cover",
              backgroundPosition: "center 65%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(12,12,12,0.55)] via-[rgba(12,12,12,0.75)] to-[var(--bg)] z-[1]" />

          <div className="relative z-10 w-full max-w-[1180px] mx-auto px-6 md:px-8 pt-20">
            <AnimateOnScroll animation="fadeLeft">
              <span className="inline-flex items-center gap-2.5 text-xs tracking-[0.18em] uppercase text-[var(--red-2)] mb-6 before:content-[''] before:w-6 before:h-px before:bg-[var(--red)]">
                Car detailing · Bahía Blanca
              </span>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeLeft" delay={100}>
              <h1 className="font-[var(--font-oswald)] text-[clamp(48px,9vw,108px)] font-semibold leading-[0.95] uppercase max-w-[900px] tracking-[0.01em]">
                Tu auto,<br />
                <span className="relative inline-block bg-[length:300%_100%] bg-[linear-gradient(110deg,var(--foreground)_30%,var(--silver-2)_45%,var(--silver)_50%,var(--foreground)_65%)] [-webkit-background-clip:text] [background-clip:text] text-transparent animate-[sweep_4.5s_ease-in-out_0.6s_infinite]">
                  reinventado.
                </span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeLeft" delay={200}>
              <p className="mt-7 text-lg text-[var(--text-dim)] max-w-[480px]">
                Lavado, pulido y ceramic coating con técnicas profesionales. Tratamos cada vehículo como si fuera el nuestro.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeLeft" delay={300}>
              <div className="flex flex-wrap gap-4 mt-10">
                <Link href="/booking" className={ctaClasses}>
                  Reservar turno
                </Link>
                <a
                  href="https://wa.me/5492915275183"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-[13px] font-medium tracking-[0.06em] uppercase rounded-[2px] border border-[var(--border)] text-[var(--foreground)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--red)] hover:text-[var(--red-2)] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] whitespace-nowrap"
                >
                  Hablar por WhatsApp
                </a>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeUp" delay={400}>
              <div className="flex gap-0 mt-20 border-t border-[var(--border)] pt-8 max-w-[620px] flex-wrap">
                <div className="pr-12 mr-12 border-r border-[var(--border)]">
                  <div className="font-[var(--font-oswald)] text-[34px] font-semibold text-[var(--red-2)]">+5</div>
                  <div className="text-xs text-[var(--text-faint)] uppercase tracking-[0.08em] mt-1">Años de experiencia</div>
                </div>
                <div className="pr-12 mr-12 border-r border-[var(--border)]">
                  <div className="font-[var(--font-oswald)] text-[34px] font-semibold text-[var(--red-2)]">100%</div>
                  <div className="text-xs text-[var(--text-faint)] uppercase tracking-[0.08em] mt-1">Satisfacción garantizada</div>
                </div>
                <div>
                  <div className="font-[var(--font-oswald)] text-[34px] font-semibold text-[var(--red-2)]">Premium</div>
                  <div className="text-xs text-[var(--text-faint)] uppercase tracking-[0.08em] mt-1">Productos certificados</div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicios" className="py-[140px] bg-[var(--bg-alt)] border-t border-[var(--border)] border-b border-[var(--border)] scroll-mt-24">
          <div className="max-w-[1180px] mx-auto px-6 md:px-8">
            <AnimateOnScroll>
              <div className="mb-16 max-w-[560px]">
                <span className="text-xs tracking-[0.18em] uppercase text-[var(--red)] mb-3.5 block">Lo que hacemos</span>
                <h2 className="font-[var(--font-oswald)] text-[clamp(32px,4vw,48px)] font-semibold uppercase tracking-[0.01em]">
                  Nuestros servicios
                </h2>
                <p className="text-[var(--text-dim)] mt-4 text-base">
                  Tres niveles de cuidado, pensados para cada necesidad y cada bolsillo.
                </p>
              </div>
            </AnimateOnScroll>

            {/* Accordion Categories */}
            <div className="space-y-px bg-[var(--border)]">
              {categories.map((cat, idx) => (
                <AnimateOnScroll key={cat.id} delay={idx * 100}>
                  <div className="bg-[var(--surface)]">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between p-6 md:p-8 text-left group hover:bg-[var(--surface-2)] transition-colors duration-300"
                    >
                      <div className="flex items-center gap-5">
                        <span className="font-[var(--font-oswald)] text-[13px] text-[var(--text-faint)] tracking-[0.1em]">
                          {cat.num}
                        </span>
                        <div>
                          <h3 className="font-[var(--font-oswald)] text-xl md:text-[26px] font-semibold uppercase tracking-[0.01em]">
                            {cat.label}
                          </h3>
                          <p className="text-sm text-[var(--text-dim)] mt-1 hidden md:block">{cat.desc}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-[var(--red-2)] transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex-shrink-0 ${
                          openCategory === cat.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Category Content (Accordion) */}
                    <div
                      className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                      style={{
                        maxHeight: openCategory === cat.id ? `${cat.services.length * 100 + 100}px` : "0px",
                      }}
                    >
                      <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0">
                        <div className="border-t border-[var(--border)] pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cat.services.map((service) => (
                              <button
                                key={service.id}
                                onClick={() => openModal(service)}
                                className="flex items-start gap-4 p-4 rounded-lg text-left bg-[var(--bg)] border border-transparent hover:border-[var(--red)]/20 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group"
                              >
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--surface-2)]">
                                  <img
                                    src={service.image}
                                    alt={service.name}
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm group-hover:text-[var(--red-2)] transition-colors duration-500">
                                    {service.name}
                                  </div>
                                  <p className="text-xs text-[var(--text-dim)] mt-1 line-clamp-2">
                                    {service.shortDesc}
                                  </p>
                                  {service.variants && (
                                    <div className="flex gap-2 mt-2">
                                      {service.variants.map((v) => (
                                        <span key={v.name} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--red)]/10 text-[var(--red-2)] border border-[var(--red)]/20">
                                          {v.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--red-2)] transition-all duration-500 mt-1 flex-shrink-0 group-hover:translate-x-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="nosotros" className="py-[140px]">
          <div className="max-w-[1180px] mx-auto px-6 md:px-8">
            <AnimateOnScroll>
              <div className="mb-16 max-w-[560px]">
                <span className="text-xs tracking-[0.18em] uppercase text-[var(--red)] mb-3.5 block">Por qué elegirnos</span>
                <h2 className="font-[var(--font-oswald)] text-[clamp(32px,4vw,48px)] font-semibold uppercase tracking-[0.01em]">
                  Cuidado de verdad
                </h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <AnimateOnScroll delay={0}>
                <div className="border-t border-[var(--border)] pt-6">
                  <div className="w-10 h-10 rounded-full border border-[var(--red)] flex items-center justify-center text-[var(--red-2)] mb-5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2L12 16.4 5.7 20.8 8 13.6 2 9.2h7.6z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium normal-case font-[var(--font-inter)] mb-2">Servicio premium</h3>
                  <p className="text-sm text-[var(--text-dim)]">Productos de alta gama y técnicas profesionales en cada paso.</p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <div className="border-t border-[var(--border)] pt-6">
                  <div className="w-10 h-10 rounded-full border border-[var(--red)] flex items-center justify-center text-[var(--red-2)] mb-5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="3"/>
                      <circle cx="12" cy="12" r="9"/>
                      <line x1="12" y1="1" x2="12" y2="4"/>
                      <line x1="12" y1="20" x2="12" y2="23"/>
                      <line x1="1" y1="12" x2="4" y2="12"/>
                      <line x1="20" y1="12" x2="23" y2="12"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium normal-case font-[var(--font-inter)] mb-2">Atención al detalle</h3>
                  <p className="text-sm text-[var(--text-dim)]">Le dedicamos el tiempo necesario a cada vehículo para un resultado impecable.</p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <div className="border-t border-[var(--border)] pt-6">
                  <div className="w-10 h-10 rounded-full border border-[var(--red)] flex items-center justify-center text-[var(--red-2)] mb-5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium normal-case font-[var(--font-inter)] mb-2">Garantía total</h3>
                  <p className="text-sm text-[var(--text-dim)]">Garantizamos el resultado en cada servicio que realizamos.</p>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* CTA Band */}
        <section className="relative py-[100px] bg-[linear-gradient(120deg,rgba(200,30,30,0.08),rgba(168,169,173,0.06))] bg-[var(--bg-alt)] border-t border-[var(--border)] border-b border-[var(--border)] text-center">
          <div className="max-w-[1180px] mx-auto px-6 md:px-8">
            <AnimateOnScroll animation="scaleUp">
              <span className="text-xs tracking-[0.18em] uppercase text-[var(--red)] mb-3.5 block text-center">
                Reservá en segundos
              </span>
              <h2 className="font-[var(--font-oswald)] text-[clamp(34px,5vw,56px)] font-semibold uppercase max-w-[640px] mx-auto mb-5">
                ¿Listo para brillar?
              </h2>
              <p className="text-[var(--text-dim)] max-w-[480px] mx-auto mb-9 text-base">
                Elegí el servicio, el día y el horario que mejor te quede. Confirmación inmediata por email.
              </p>
              <Link href="/booking" className={ctaClasses}>
                Reservar ahora
              </Link>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16">
        <div className="max-w-[1180px] mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-12 border-b border-[var(--border)]">
            <div>
              <Image
                src="/img/logo.svg"
                alt="Fullshine Car Detailing"
                width={140}
                height={140}
                className="mb-3"
              />
              <p className="text-[var(--text-faint)] text-[13px] max-w-[280px]">
                Car detailing premium en Bahía Blanca. Tu auto, como nuevo.
              </p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-[13px] text-[var(--text-dim)] tracking-[0.04em] uppercase hover:text-[var(--red-2)] transition-colors duration-500 ease-out">
                Instagram
              </a>
              <a
                href="https://wa.me/5492915275183"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[var(--text-dim)] tracking-[0.04em] uppercase hover:text-[var(--red-2)] transition-colors duration-500 ease-out"
              >
                WhatsApp
              </a>
              <a href="#servicios" className="text-[13px] text-[var(--text-dim)] tracking-[0.04em] uppercase hover:text-[var(--red-2)] transition-colors duration-500 ease-out">
                Servicios
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6 text-xs text-[var(--text-faint)]">
            <span>© 2026 Fullshine Car Detailing. Todos los derechos reservados.</span>
            <span>Bahía Blanca, Argentina</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5492915275183"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-7 right-7 z-50 w-14 h-14 rounded-full bg-[var(--red)] flex items-center justify-center shadow-[0_6px_24px_rgba(200,30,30,0.4)] hover:scale-110 transition-transform duration-500"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </a>

      {/* Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative h-56 md:h-64 flex-shrink-0">
              <img
                src={selectedService.image}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-6">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--red)]">{selectedService.category}</span>
                <h3 className="font-[var(--font-oswald)] text-2xl font-semibold uppercase">{selectedService.name}</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">
                {selectedService.fullDesc}
              </p>

              {/* Variants for Cerámico */}
              {selectedService.variants && (
                <div className="mt-6">
                  <span className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)] block mb-3">
                    Elegí la duración del sellado
                  </span>
                  <div className="space-y-2">
                    {selectedService.variants.map((variant) => (
                      <button
                        key={variant.name}
                        onClick={() => setSelectedVariant(variant)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-300 text-sm ${
                          selectedVariant?.name === variant.name
                            ? "border-[var(--red)] bg-[var(--red)]/5 text-[var(--red-2)]"
                            : "border-[var(--border)] hover:border-[var(--red)]/30 text-[var(--text-dim)]"
                        }`}
                      >
                        <div className="font-medium">{variant.name}</div>
                        <p className="text-xs text-[var(--text-faint)] mt-1">{variant.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-0 flex-shrink-0">
              <Link
                href={`/booking?category=${selectedService.category}`}
                onClick={closeModal}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-medium tracking-[0.06em] uppercase rounded-[2px] bg-gradient-to-br from-[var(--silver)] via-[var(--silver-2)] to-[var(--silver-3)] text-[#1a1a1a] hover:shadow-[0_4px_24px_rgba(200,200,200,0.3)] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              >
                Reservar este servicio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes sweep {
          0% { background-position: 200% 0; }
          45% { background-position: -50% 0; }
          100% { background-position: -50% 0; }
        }
      `}</style>
    </div>
  );
}
