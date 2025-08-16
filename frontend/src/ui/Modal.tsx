import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** "md" | "xl" | "full" */
  size?: "md" | "xl" | "full";
};

export default function Modal({ open, onClose, children, title, size = "xl" }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!open) return null;

  const sizeCls =
    size === "full"
      ? "w-[98vw] h-[92vh] max-w-[1400px]"
      : size === "xl"
      ? "w-[95vw] max-w-6xl"
      : "w-full max-w-xl";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* panel (no backdrop-blur to avoid DnD offset) */}
      <div
        className={`relative z-10 mx-4 rounded-2xl bg-white shadow-xl border p-5 ${sizeCls}`}
        style={{ maxHeight: "92vh", overflow: "auto" }}
      >
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
