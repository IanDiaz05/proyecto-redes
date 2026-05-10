import { Activity, Database, LayoutDashboard, Server, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans overflow-hidden">
      
      {/* Overlay para móviles */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold tracking-tight">DW & Telemetry</h1>
          </div>
          <button 
            className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Menú de Navegación con Rutas */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard />} label="Resumen General" />
          <NavItem to="/ecommerce" icon={<Activity />} label="Ventas E-commerce" />
          <NavItem to="/iot" icon={<Server />} label="Telemetría IoT" />
          
          <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
            <NavItem to="/configuracion" icon={<Settings />} label="Configuración" />
          </div>
        </nav>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="text-sm font-semibold tracking-tight">Panel de Control</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">FastAPI • React • Chart.js</p>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              API Conectada
            </span>
          </div>
        </header>

        {/* Área de Contenido Dinámico */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Subcomponente de navegación usando NavLink
function NavItem({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' 
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
        }`
      }
    >
      <span className="w-4 h-4 flex items-center justify-center">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}