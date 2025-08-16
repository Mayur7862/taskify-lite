export default function StatusBadge({ status }: { status: "ACTIVE" | "COMPLETED" | "ON_HOLD" }) {
  const map = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ON_HOLD: "bg-amber-100 text-amber-700 border-amber-200",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${map[status]}`}
      title={status}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
      {status}
    </span>
  );
}
