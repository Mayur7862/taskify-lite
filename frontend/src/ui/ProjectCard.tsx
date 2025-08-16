import { useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import { LIST_ORGS, CREATE_ORG } from "../graphql/organizations";

export default function OrgPicker() {
  const { data, loading, error, refetch } = useQuery(LIST_ORGS);
  const [createOrg] = useMutation(CREATE_ORG, {
    refetchQueries: [{ query: LIST_ORGS }],
    awaitRefetchQueries: true,
  });

  const currentSlug = useMemo(() => localStorage.getItem("orgSlug") || "", []);
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const onSelect = (slug: string) => {
    localStorage.setItem("orgSlug", slug);
    location.reload();
  };

  const onClear = () => {
    localStorage.removeItem("orgSlug");
    location.reload();
  };

  const onCreate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const contactEmail = String(fd.get("contactEmail") || "").trim();
    const slug = String(fd.get("slug") || "").trim() || undefined;
    if (!name || !contactEmail) return;

    setCreating(true);
    try {
      const res = await createOrg({ variables: { name, contactEmail, slug} });
      const org = res.data?.createOrganization?.organization;
      if (org?.slug) {
        localStorage.setItem("orgSlug", org.slug);
        await refetch();
        location.reload();
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row with generous spacing */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">Organization</div>
          <select
            disabled={loading}
            value={currentSlug}
            onChange={(e) => onSelect(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="" disabled>
              Select an organization…
            </option>
            {data?.organizations?.map((o: any) => (
              <option key={o.id} value={o.slug}>
                {o.name} ({o.slug})
              </option>
            ))}
          </select>
          {error && <span className="text-xs text-red-600">{error.message}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm font-medium shadow hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            title="Create a new organization"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            New
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-300"
            title="Clear active organization"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 6l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12M10 10v6M14 10v6" strokeLinecap="round" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Helpful hint */}
      <p className="text-xs text-gray-500">
        Tip: requests include <code className="px-1 py-0.5 rounded bg-gray-100 border">X-Org-Slug</code> for multi-tenancy.
      </p>

      {/* Create org form (nicer placeholders & spacing) */}
      {formOpen && (
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Organization name</label>
            <input
              name="name"
              placeholder="Los Pollos Hermos."
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-600">Contact email</label>
            <input
              name="contactEmail"
              type="email"
              placeholder="fring@pollos.com"
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-600">Slug (optional)</label>
            <input
              name="slug"
              placeholder="albequerque, new-mexico"
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              If empty, the server will generate a slug from the name.
            </p>
          </div>

          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm font-medium shadow hover:brightness-110 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create organization"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
