import { useMutation, useQuery } from "@apollo/client";
import { CREATE_PROJECT, LIST_PROJECTS } from "../graphql/projects";
import { useState } from "react";
import ProjectDetailsSimple from "./ProjectDetails";

export default function ProjectsSimple() {
  const { data, loading, error } = useQuery(LIST_PROJECTS);
  const [createProject] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: LIST_PROJECTS }],
    awaitRefetchQueries: true,
  });
  const [selected, setSelected] = useState<any | null>(null);

  const onCreate = async () => {
    const currentOrg = localStorage.getItem("orgSlug");
    if (!currentOrg) {
      alert("Pick or create an Organization first.");
      return;
    }
    const name = prompt("Project name?");
    if (!name) return;
    await createProject({ variables: { name, status: "ACTIVE" } });
  };

  if (loading) return <p>Loading projects…</p>;
  if (error) return <p style={{ color: "crimson" }}>{error.message}</p>;

  const projects = data?.projects ?? [];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {selected && <button onClick={() => setSelected(null)}>Back</button>}
          <button onClick={onCreate}>New Project</button>
        </div>
      </div>

      {!selected ? (
        projects.length === 0 ? (
          <div style={{ padding: 12, border: "1px solid #eee" }}>No projects yet.</div>
        ) : (
          <ul style={{ display: "grid", gap: 8, padding: 0, margin: 0, listStyle: "none" }}>
            {projects.map((p: any) => (
              <li key={p.id} style={{ padding: 12, border: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{p.name}</strong>
                  <small>{p.status}</small>
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Tasks: {p.completedTasks}/{p.taskCount}
                </div>
                {p.description && <div style={{ fontSize: 13, marginTop: 4 }}>{p.description}</div>}
                {p.dueDate && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Due: {p.dueDate}</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setSelected(p)}>View</button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <ProjectDetailsSimple project={selected} />
      )}
    </div>
  );
}




// import { useMutation, useQuery } from "@apollo/client";
// import { CREATE_PROJECT, LIST_PROJECTS } from "../graphql/projects";

// export default function ProjectsSimple() {
//   const { data, loading, error } = useQuery(LIST_PROJECTS);
//   const [createProject] = useMutation(CREATE_PROJECT, {
//     refetchQueries: [{ query: LIST_PROJECTS }],
//     awaitRefetchQueries: true,
//   });

//   const onCreate = async () => {
//     const currentOrg = localStorage.getItem("orgSlug");
//     if (!currentOrg) {
//       alert("Pick or create an Organization first.");
//       return;
//     }
//     const name = prompt("Project name?");
//     if (!name) return;
//     await createProject({ variables: { name, status: "ACTIVE" } });
//   };

//   if (loading) return <p>Loading projects…</p>;
//   if (error) return <p style={{ color: "crimson" }}>{error.message}</p>;

//   const projects = data?.projects ?? [];

//   return (
//     <div style={{ display: "grid", gap: 8 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
//         <h2 style={{ margin: 0 }}>Projects</h2>
//         <button onClick={onCreate}>New Project</button>
//       </div>

//       {projects.length === 0 ? (
//         <div style={{ padding: 12, border: "1px solid #eee" }}>No projects yet.</div>
//       ) : (
//         <ul style={{ display: "grid", gap: 8, padding: 0, margin: 0, listStyle: "none" }}>
//           {projects.map((p: any) => (
//             <li key={p.id} style={{ padding: 12, border: "1px solid #eee" }}>
//               <div style={{ display: "flex", justifyContent: "space-between" }}>
//                 <strong>{p.name}</strong>
//                 <small>{p.status}</small>
//               </div>
//               <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
//                 Tasks: {p.completedTasks}/{p.taskCount}
//               </div>
//               {p.description && <div style={{ fontSize: 13, marginTop: 4 }}>{p.description}</div>}
//               {p.dueDate && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Due: {p.dueDate}</div>}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
