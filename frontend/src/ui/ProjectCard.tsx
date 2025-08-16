import StatusBadge from "./StatusBadge";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  dueDate?: string | null;
  taskCount: number;
  completedTasks: number;
};

export default function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const pct =
    p.taskCount > 0 ? Math.min(100, Math.round((p.completedTasks / p.taskCount) * 100)) : 0;

  return (
    <div className="group rounded-2xl bg-white/80 backdrop-blur border shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 group-hover:text-gray-950">{p.name}</h3>
          <StatusBadge status={p.status} />
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{p.description || "—"}</p>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {p.completedTasks}/{p.taskCount}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {p.dueDate && (
          <div className="mt-3 text-xs text-gray-500">Due: {p.dueDate}</div>
        )}
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={onOpen}
          className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View details
        </button>
      </div>
    </div>
  );
}
