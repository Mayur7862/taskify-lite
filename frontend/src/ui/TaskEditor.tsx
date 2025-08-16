import { useMutation } from "@apollo/client";
import { useMemo, useState } from "react";
import { ADD_COMMENT, TASKS, UPDATE_TASK } from "../graphql/tasks";
import Button from "./Button";

type Task = {
  id: string | number;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assigneeEmail?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  comments?: { id: string; content: string; authorEmail: string; createdAt?: string | null }[];
};

export default function TaskEditor({
  task,
  projectId,
  onClose,
}: {
  task: Task;
  projectId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [description, setDescription] = useState(task.description || "");
  const [assigneeEmail, setAssigneeEmail] = useState(task.assigneeEmail || "");
  const [due, setDue] = useState<string>(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "");
  const [saving, setSaving] = useState(false);

  const comments = useMemo(() => task.comments || [], [task.comments]);
  const [commentText, setCommentText] = useState("");
  const [commentEmail, setCommentEmail] = useState("");

  const [updateTask] = useMutation(UPDATE_TASK, {
    refetchQueries: [{ query: TASKS, variables: { projectId } }],
    awaitRefetchQueries: true,
  });

  const [addComment] = useMutation(ADD_COMMENT, {
    refetchQueries: [{ query: TASKS, variables: { projectId } }],
    awaitRefetchQueries: true,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTask({
        variables: {
          id: String(task.id),
          title,
          status,
          description: description || null,
          assigneeEmail: assigneeEmail || null,
          dueDate: due ? new Date(due).toISOString() : null,
        },
        optimisticResponse: {
          updateTask: {
            ok: true,
            __typename: "UpdateTask",
            task: {
              __typename: "TaskType",
              id: String(task.id),
              title,
              status,
              description,
              assigneeEmail,
              dueDate: due ? new Date(due).toISOString() : null,
              createdAt: task.createdAt || null,
              comments: comments.map((c) => ({ __typename: "TaskCommentType", ...c })),
            },
          },
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

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !commentEmail.trim()) return;
    try {
      await addComment({
        variables: {
          taskId: String(task.id),
          content: commentText.trim(),
          authorEmail: commentEmail.trim(),
        },
      });
      setCommentText("");
      // keep email for next comment
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Title</label>
            <input
              className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="border w-full px-3 py-2 rounded-xl bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as Task["status"])}
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Assignee Email</label>
            <input
              type="email"
              className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
              value={assigneeEmail}
              onChange={(e) => setAssigneeEmail(e.target.value)}
              placeholder="teammate@org.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Due (date & time)</label>
            <input
              type="datetime-local"
              className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              className="border w-full px-3 py-2 rounded-xl min-h-[90px] focus:ring-2 focus:ring-indigo-200 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Close
          </Button>
          <Button disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-2">Comments</h4>

        <div className="grid gap-2 mb-3">
          {(comments || []).length === 0 && (
            <div className="text-xs text-gray-500">No comments yet.</div>
          )}
          {(comments || []).map((c) => (
            <div key={c.id} className="text-sm bg-gray-50 border rounded-xl p-2">
              <div className="text-xs text-gray-600">
                {c.authorEmail} • {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
              </div>
              <div>{c.content}</div>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} className="grid md:grid-cols-[1fr_240px_auto] gap-2">
          <input
            className="border px-3 py-2 rounded-xl"
            placeholder="Write a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
          />
          <input
            className="border px-3 py-2 rounded-xl"
            placeholder="your@email.com"
            type="email"
            value={commentEmail}
            onChange={(e) => setCommentEmail(e.target.value)}
            required
          />
          <Button size="sm" type="submit">
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
