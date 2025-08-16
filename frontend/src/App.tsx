import TopBar from "./ui/TopBar";
import OrgPicker from "./ui/OrgPicker";
import ProjectsSimple from "./ui/ProjectsSimple";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <TopBar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Organization header row */}
        <section className="rounded-2xl border bg-white shadow-sm p-4">
          <OrgPicker />
        </section>

        {/* Projects area */}
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-gray-500">Organize work by goals, owners, and timelines.</p>
          <ProjectsSimple />
        </section>
      </main>
    </div>
  );
}
