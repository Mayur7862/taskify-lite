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
      const res = await createOrg({ variables: { name, contactEmail, slug } });
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
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "#555" }}>Organization</label>
        <select
          disabled={loading}
          value={currentSlug}
          onChange={(e) => onSelect(e.target.value)}
          style={{ padding: "6px 8px" }}
        >
          <option value="" disabled>Select…</option>
          {data?.organizations?.map((o: any) => (
            <option key={o.id} value={o.slug}>
              {o.name} ({o.slug})
            </option>
          ))}
        </select>
        <button onClick={() => setFormOpen((v) => !v)}>New</button>
        <button onClick={onClear}>Clear</button>
        {error && <span style={{ color: "crimson", fontSize: 12 }}>{error.message}</span>}
      </div>

      {formOpen && (
        <form onSubmit={onCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="name" placeholder="Org name" required />
          <input name="contactEmail" type="email" placeholder="admin@org.com" required />
          <input name="slug" placeholder="(optional slug)" />
          <button disabled={creating}>{creating ? "Creating…" : "Create Org"}</button>
        </form>
      )}
    </div>
  );
}


// import { useMutation, useQuery } from "@apollo/client";
// import { useMemo, useState } from "react";
// import { LIST_ORGS, CREATE_ORG } from "../graphql/organizations";
// import Button from "./Button";

// export default function OrgPicker() {
//   const { data, loading, error, refetch } = useQuery(LIST_ORGS);
//   const [formOpen, setFormOpen] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [createOrg] = useMutation(CREATE_ORG, {
//     refetchQueries: [{ query: LIST_ORGS }],
//     awaitRefetchQueries: true,
//   });

//   const currentSlug = useMemo(() => localStorage.getItem("orgSlug") || "", []);
//   const currentOrg = data?.organizations?.find((o: any) => o.slug === currentSlug);

//   const onSelect = (slug: string) => {
//     localStorage.setItem("orgSlug", slug);
//     window.location.reload();
//   };
//   const onClear = () => {
//     localStorage.removeItem("orgSlug");
//     window.location.reload();
//   };

//   const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const fd = new FormData(e.currentTarget);
//     const name = String(fd.get("name") || "").trim();
//     const contactEmail = String(fd.get("contactEmail") || "").trim();
//     const slug = String(fd.get("slug") || "").trim() || undefined;
//     if (!name || !contactEmail) return;

//     setCreating(true);
//     try {
//       const res = await createOrg({ variables: { name, contactEmail, slug } });
//       const org = res.data?.createOrganization?.organization;
//       if (org?.slug) {
//         localStorage.setItem("orgSlug", org.slug);
//         await refetch();
//         window.location.reload();
//       }
//     } catch (err) {
//       console.error(err);
//       alert((err as Error).message);
//     } finally {
//       setCreating(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-2">
//       <div className="flex items-center gap-2">
//         <select
//           disabled={loading}
//           className="border px-3 py-2 rounded-xl bg-white text-sm"
//           value={currentSlug}
//           onChange={(e) => onSelect(e.target.value)}
//         >
//           <option value="" disabled>
//             Select organization…
//           </option>
//           {data?.organizations?.map((o: any) => (
//             <option key={o.id} value={o.slug}>
//               {o.name} ({o.slug})
//             </option>
//           ))}
//         </select>

//         <Button variant="secondary" size="sm" onClick={() => setFormOpen((v) => !v)}>
//           {formOpen ? "Close" : "New"}
//         </Button>
//         <Button variant="ghost" size="sm" onClick={onClear} title="Clear selection">
//           Clear
//         </Button>

//         {currentOrg && (
//           <span className="ml-2 text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
//             Active: {currentOrg.name}
//           </span>
//         )}
//       </div>

//       {formOpen && (
//         <form
//           onSubmit={onCreate}
//           className="w-full bg-white/80 backdrop-blur rounded-2xl border shadow p-3 flex flex-wrap gap-2 items-center"
//         >
//           <input
//             name="name"
//             placeholder="Organization name"
//             className="border px-3 py-2 rounded-xl w-56"
//             required
//           />
//           <input
//             name="contactEmail"
//             placeholder="admin@org.com"
//             type="email"
//             className="border px-3 py-2 rounded-xl w-56"
//             required
//           />
//           <input
//             name="slug"
//             placeholder="optional slug"
//             className="border px-3 py-2 rounded-xl w-40"
//           />
//           <Button size="sm" disabled={creating}>
//             {creating ? "Creating…" : "Create"}
//           </Button>
//           {error && <span className="text-red-600 text-sm">{String(error.message)}</span>}
//         </form>
//       )}
//     </div>
//   );
// }
