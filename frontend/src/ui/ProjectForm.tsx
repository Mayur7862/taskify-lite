import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_PROJECT, LIST_PROJECTS } from "../graphql/projects";
import Button from "./Button";

type Props = { onClose: () => void };

export default function ProjectForm({ onClose }: Props) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED" | "ON_HOLD">("ACTIVE");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [createProject] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: LIST_PROJECTS }],
    awaitRefetchQueries: true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentOrg = localStorage.getItem("orgSlug");
    if (!currentOrg) {
      alert("Select or create an Organization first.");
      return;
    }
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createProject({
        variables: {
          name,
          status,
          description: description || null,
          dueDate: dueDate || null,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Name</label>
          <input
            className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Website Revamp"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Status</label>
          <select
            className="border w-full px-3 py-2 rounded-xl bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON_HOLD</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Due Date</label>
          <input
            type="date"
            className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm text-gray-600">Description</label>
          <textarea
            className="border w-full px-3 py-2 rounded-xl min-h-[90px] focus:ring-2 focus:ring-indigo-200 outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Goals, scope, notes…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button disabled={saving}>
          {saving ? "Saving…" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
