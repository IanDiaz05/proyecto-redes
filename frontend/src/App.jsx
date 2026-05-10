import DashboardLayout from "./layouts/DashboardLayout"
import KpiCards from "./components/KpiCards"

function App() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground">
      
        <div className="border-b">
          <div className="flex h-16 items-center px-4 md:px-8">
            <h2 className="text-lg font-semibold tracking-tight">
              Data Warehouse & IoT
            </h2>
            <div className="ml-auto flex items-center space-x-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-muted-foreground">Sistema Online</span>
            </div>
          </div>
        </div>

        
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
          </div>
          
          
          <KpiCards/>
          
          
        </main>
      </div>
    </DashboardLayout>
  )
}

export default App