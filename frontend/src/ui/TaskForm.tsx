import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_TASK, TASKS } from "../graphql/tasks";
import Button from "./Button";

type Props = { projectId: string; onClose: () => void };

export default function TaskForm({ projectId, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [description, setDescription] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [due, setDue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [createTask] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: TASKS, variables: { projectId } }],
    awaitRefetchQueries: true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        variables: {
          projectId,
          title,
          status,
          description: description || null,
          assigneeEmail: assigneeEmail || null,
          dueDate: due ? new Date(due).toISOString() : null,
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
          <label className="text-sm text-gray-600">Title</label>
          <input className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design login screen" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Status</label>
          <select className="border w-full px-3 py-2 rounded-xl bg-white focus:ring-2 focus:ring-indigo-200 outline-none" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Assignee Email</label>
          <input type="email" className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none" value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} placeholder="teammate@org.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Due (date & time)</label>
          <input type="datetime-local" className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm text-gray-600">Description</label>
          <textarea className="border w-full px-3 py-2 rounded-xl min-h-[90px] focus:ring-2 focus:ring-indigo-200 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done, acceptance criteria, notes…" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button disabled={saving}>{saving ? "Saving…" : "Create Task"}</Button>
      </div>
    </form>
  );
}
