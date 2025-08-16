import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { TASKS, UPDATE_TASK } from "../graphql/tasks";
import TaskCard from "./TaskCard";
import Modal from "./Modal";
import TaskForm from "./TaskForm";
import Button from "./Button";
import TaskEditor from "./TaskEditor";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  dueDate?: string | null;
  taskCount: number;
  completedTasks: number;
};

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

const COLUMNS: { key: Task["status"]; title: string }[] = [
  { key: "TODO", title: "To do" },
  { key: "IN_PROGRESS", title: "In progress" },
  { key: "DONE", title: "Done" },
];

export default function ProjectDetails({ project }: { project: Project }) {
  const { data, loading, error, refetch } = useQuery(TASKS, {
    variables: { projectId: project.id },
    fetchPolicy: "cache-and-network",
  });

  const [board, setBoard] = useState<Record<Task["status"], Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [updateTask] = useMutation(UPDATE_TASK);

  const tasks: Task[] = useMemo(
    () => (data?.tasks ?? []).map((t: any) => ({ ...t, id: String(t.id) })),
    [data]
  );

  useEffect(() => {
    setBoard({
      TODO: tasks.filter((t) => t.status === "TODO"),
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
      DONE: tasks.filter((t) => t.status === "DONE"),
    });
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const srcCol = source.droppableId as Task["status"];
    const dstCol = destination.droppableId as Task["status"];
    if (srcCol === dstCol && source.index === destination.index) return;

    const moving = board[srcCol][source.index];
    if (!moving) return;

    setBoard((prev) => {
      const next = { ...prev };
      const srcList = Array.from(next[srcCol]);
      const [removed] = srcList.splice(source.index, 1);
      const dstList = Array.from(next[dstCol]);
      dstList.splice(destination.index, 0, { ...removed, status: dstCol });
      next[srcCol] = srcList;
      next[dstCol] = dstList;
      return next;
    });

    if (srcCol !== dstCol) {
      try {
        await updateTask({
          variables: { id: String(draggableId), status: dstCol },
          optimisticResponse: {
            updateTask: {
              ok: true,
              __typename: "UpdateTask",
              task: { __typename: "TaskType", ...moving, id: String(moving.id), status: dstCol },
            },
          },
        });
      } catch (e) {
        console.error(e);
        refetch();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{project.name}</h3>
          {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Button onClick={() => setShowTaskForm(true)}>New Task</Button>
        </div>
      </div>

      {loading && <div className="text-gray-500">Loading tasks…</div>}
      {error && <div className="text-red-600">{error.message}</div>}

      {!loading && !error && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <Droppable key={col.key} droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl border bg-white p-3 min-h-[420px] transition ${
                      snapshot.isDraggingOver ? "ring-2 ring-indigo-300" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">{col.title}</h4>
                      <span className="text-[10px] text-gray-500">{board[col.key].length}</span>
                    </div>

                    <div className="space-y-2">
                      {board[col.key].map((t, idx) => (
                        <Draggable key={String(t.id)} draggableId={String(t.id)} index={idx}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setSelected(t)}
                            >
                              <TaskCard t={t} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      <Modal open={showTaskForm} onClose={() => setShowTaskForm(false)} title="Create Task">
        <TaskForm projectId={project.id} onClose={() => setShowTaskForm(false)} />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Edit Task">
        {selected && (
          <TaskEditor
            task={selected}
            projectId={project.id}
            onClose={() => {
              setSelected(null);
              setTimeout(() => refetch(), 0);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
