export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-white to-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
              <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Taskify-lite</h1>
            <p className="text-xs text-gray-500">Lightweight multi-tenant projects</p>
          </div>
        </div>
      </div>
    </header>
  );
}
