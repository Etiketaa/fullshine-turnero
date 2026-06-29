"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Car, 
  LogOut,
  Menu,
  X,
  Wrench,
  Package,
  FileText
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Disponibilidad", href: "/admin/availability", icon: Calendar },
    { label: "Servicios", href: "/admin/services", icon: Car },
    { label: "Vehículos", href: "/admin/vehicles", icon: Wrench },
    { label: "Órdenes", href: "/admin/work-orders", icon: FileText },
    { label: "Productos", href: "/admin/products", icon: Package },
    { label: "Clientes", href: "/admin/clients", icon: Users },
    { label: "Configuración", href: "/admin/settings", icon: Settings },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6">
        <span className="font-bold tracking-tighter">FULL<span className="text-red-500">SHINE</span> ADMIN</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-20 flex items-center px-8 border-b border-white/5">
            <span className="text-xl font-bold tracking-tighter">FULL<span className="text-red-500 text-sm">SHINE ADMIN</span></span>
          </div>
          
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  pathname === item.href 
                    ? "bg-red-600 text-white font-bold" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", pathname === item.href ? "" : "group-hover:text-red-500")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
