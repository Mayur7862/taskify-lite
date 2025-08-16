import { useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import { LIST_PROJECTS } from "../graphql/projects";
import ProjectForm from "./ProjectForm";
import Modal from "./Modal";
import Button from "./Button";
import ProjectCard from "./ProjectCard";

type Status = "ALL" | "ACTIVE" | "COMPLETED" | "ON_HOLD";

export default function ProjectDashboard() {
  const { data, loading, error } = useQuery(LIST_PROJECTS);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Status>("ALL");

  const projects = data?.projects ?? [];
  const filtered = useMemo(
    () => (filter === "ALL" ? projects : projects.filter((p: any) => p.status === filter)),
    [projects, filter]
  );

  if (loading) return <div className="text-gray-500">Loading projects…</div>;
  if (error) return <div className="text-red-600">{error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-gray-500">Organize work by goals, owners, and timelines.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border bg-white overflow-hidden">
            {(["ALL", "ACTIVE", "COMPLETED", "ON_HOLD"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-sm transition ${
                  filter === s
                    ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white"
                    : "hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowForm(true)}>New Project</Button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white/70 backdrop-blur p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 opacity-90 mb-3"></div>
          <h3 className="font-semibold">No projects found</h3>
          <p className="text-sm text-gray-600 mt-1">Create your first project to get started.</p>
          <div className="mt-4"><Button onClick={() => setShowForm(true)}>Create a project</Button></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p: any) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* Modal for form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Project">
        <ProjectForm onClose={() => setShowForm(false)} />
      </Modal>

      {/* FAB */}
      <div className="fixed bottom-6 right-6">
        <Button size="sm" onClick={() => setShowForm(true)} className="shadow-lg">
          + New Project
        </Button>
      </div>
    </div>
  );
}
