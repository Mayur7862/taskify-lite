type Props = { status: "ACTIVE" | "COMPLETED" | "ON_HOLD" };

export default function StatusBadge({ status }: Props) {
  const color =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "COMPLETED"
      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full border ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
}
