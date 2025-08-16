import OrgPicker from "./ui/OrgPicker";
import ProjectDashboard from "./ui/ProjectDashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow"></div>
            <h1 className="text-xl font-bold tracking-tight">
              Mini <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">PM</span>
            </h1>
          </div>
          <div className="flex-1 min-w-[280px]">
            <OrgPicker />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <ProjectDashboard />
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        Built with Django · GraphQL · React
      </footer>
    </div>
  );
}
