type Task = {
  id: string | number;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assigneeEmail?: string | null;
  dueDate?: string | null;
};

export default function TaskCard({ t }: { t: Task }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm hover:shadow transition cursor-grab active:cursor-grabbing select-none">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-medium text-gray-900">{t.title}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border text-gray-600">
          {t.status}
        </span>
      </div>
      {t.description && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-3">{t.description}</p>
      )}
      <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-3">
        {t.assigneeEmail && <span>👤 {t.assigneeEmail}</span>}
        {t.dueDate && <span>🗓 {new Date(t.dueDate).toLocaleString()}</span>}
      </div>
    </div>
  );
}
