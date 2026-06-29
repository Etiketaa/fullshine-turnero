"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Car, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: "client" | "service" | "product";
  icon: React.ReactNode;
  href: string;
};

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Parent will handle opening
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  const search = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const lower = term.toLowerCase();
    const allResults: SearchResult[] = [];

    const [clientsRes, servicesRes, productsRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, first_name, last_name, email, phone")
        .or(`first_name.ilike.%${lower}%,last_name.ilike.%${lower}%,email.ilike.%${lower}%,phone.ilike.%${lower}%`)
        .limit(5),
      supabase
        .from("services")
        .select("id, name, category")
        .or(`name.ilike.%${lower}%,category.ilike.%${lower}%`)
        .limit(5),
      supabase
        .from("products")
        .select("id, name, brand")
        .or(`name.ilike.%${lower}%,brand.ilike.%${lower}%`)
        .limit(5),
    ]);

    if (clientsRes.data) {
      clientsRes.data.forEach((c) =>
        allResults.push({
          id: c.id,
          title: `${c.first_name} ${c.last_name}`,
          subtitle: c.email || c.phone,
          type: "client",
          icon: <User className="w-4 h-4" />,
          href: "/admin/clients",
        })
      );
    }

    if (servicesRes.data) {
      servicesRes.data.forEach((s) =>
        allResults.push({
          id: s.id,
          title: s.name,
          subtitle: s.category,
          type: "service",
          icon: <Car className="w-4 h-4" />,
          href: "/admin/services",
        })
      );
    }

    if (productsRes.data) {
      productsRes.data.forEach((p) =>
        allResults.push({
          id: p.id,
          title: p.name,
          subtitle: p.brand,
          type: "product",
          icon: <Package className="w-4 h-4" />,
          href: "/admin/products",
        })
      );
    }

    setResults(allResults);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(result: SearchResult) {
    router.push(result.href);
    onClose();
  }

  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  const typeLabels: Record<string, string> = {
    client: "Clientes",
    service: "Servicios",
    product: "Productos",
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        onClick={() => onClose()}
      />

      <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh]">
        <div className="w-full max-w-xl mx-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar clientes, servicios o productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={() => onClose()}
              className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Buscando...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <div className="px-6 py-2 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      {typeLabels[type]}
                    </div>
                    {items.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="p-2 bg-red-600/10 rounded-lg text-red-500">
                          {r.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{r.title}</div>
                          <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No se encontraron resultados para &quot;{query}&quot;
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Escribí al menos 2 caracteres para buscar
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">ESC</kbd>
              para cerrar
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
