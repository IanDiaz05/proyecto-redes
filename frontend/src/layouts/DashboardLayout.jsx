import { Activity, Database, LayoutDashboard, Server, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import OrderSearch from "@/components/OrderSearch";

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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 transform border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold tracking-tight">Data Warehouse</h1>
          </div>
          <button 
            className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Menú de Navegación con Rutas */}
        <nav className="flex-1 p-4 flex flex-col overflow-y-auto">
          
          {/* Grupo de enlaces superiores */}
          <div className="space-y-1">
            <NavItem to="/" icon={<LayoutDashboard />} label="Resumen General" />
            <NavItem to="/ecommerce" icon={<Activity />} label="Ventas E-commerce" />
            <NavItem to="/iot" icon={<Server />} label="Telemetría IoT" />
          </div>
          
          {/* Sección de Desarrolladores */}
          <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
            <NavItem to="/docs" icon={<BookOpen />} label="API Docs" />
            
            <a 
              href="https://github.com/IanDiaz05/proyecto-redes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            >
              <span className="w-4 h-4 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </span>
              Repositorio GitHub
            </a>
          </div>
        </nav>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 flex-1"> {/* Añadimos flex-1 aquí */}
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
            
            {/* AQUÍ INSERTAMOS EL COMPONENTE DE BÚSQUEDA */}
            <OrderSearch />
            
          </div>

          <div className="ml-auto flex shrink-0 items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
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