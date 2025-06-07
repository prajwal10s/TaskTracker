// src/components/TaskCard.tsx
import React from "react";
import { api } from "~/utils/api"; // Assuming your tRPC client setup
import Link from "next/link";
import { format } from "date-fns"; // You'll need to install this: `npm install date-fns`
import { Task, Tag } from "@prisma/client";
import { TaskWithRelations } from "~/types";
import { types } from "node:util";
import { TaskWithTags } from "~/types";
// --- Mock/Assumed tRPC Types (ensure these match your actual tRPC types) ---

// -------------------------------------------------------------------------

interface TaskCardProps {
  task: TaskWithRelations;
  onTaskUpdated?: () => void; // Callback to refresh list after update/delete
  onTaskDeleted?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const toggleTaskStatusMutation = api.task.update.useMutation({
    onSuccess: () => {
      onTaskUpdated?.(); // Invalidate queries or refetch after successful update
    },
  });

  const deleteTaskMutation = api.task.delete.useMutation({
    onSuccess: () => {
      onTaskDeleted?.(); // Invalidate queries or refetch after successful delete
    },
  });

  const handleToggleStatus = () => {
    toggleTaskStatusMutation.mutate({
      id: task.id,
      status: task.status === "TODO" ? "IN_PROGRESS" : "TODO",
    });
  };

  const handleDeleteTask = () => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      deleteTaskMutation.mutate({ id: task.id });
    }
  };

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`relative rounded-lg p-6 shadow-md ${
        task.status === "DONE"
          ? "border-l-4 border-green-500 bg-gray-50 opacity-80"
          : "border-l-4 border-blue-500 bg-white"
      }`}
    >
      {task.status === "DONE" && (
        <span className="absolute right-4 top-4 text-sm font-bold text-green-600">
          DONE
        </span>
      )}

      <h3
        className={`mb-2 text-xl font-bold ${task.status === "DONE" ? "text-gray-500 line-through" : "text-gray-800"}`}
      >
        {task.title}
      </h3>
      {task.description && (
        <p className="mb-3 text-sm italic text-gray-600">{task.description}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
        {task.deadline && (
          <span className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800">
            🗓️ Due: {format(new Date(task.deadline), "PPP p")}
          </span>
        )}
        <span className="flex items-center rounded-full px-3 py-1">
          {task.priority.toUpperCase()} PRIORITY
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {task.assignee && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium text-gray-700">Assigned To:</p>
          <div className="flex flex-wrap gap-2">
            <span
              key={task.assignee.id}
              className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
            >
              👤 {task.assignee.name}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleToggleStatus}
          className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
            task.status === "IN_PROGRESS"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={toggleTaskStatusMutation.isPending}
        >
          {toggleTaskStatusMutation.isPending
            ? "Updating..."
            : task.status === "IN_PROGRESS"
              ? "Mark Complete"
              : "Mark Pending"}
        </button>

        <Link
          href={`/tasks/${task.id}`}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Edit
        </Link>

        <button
          onClick={handleDeleteTask}
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          disabled={deleteTaskMutation.isPending}
        >
          {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {(toggleTaskStatusMutation.isError || deleteTaskMutation.isError) && (
        <p className="mt-2 text-sm text-red-500">
          Error:{" "}
          {toggleTaskStatusMutation.error?.message ||
            deleteTaskMutation.error?.message}
        </p>
      )}
    </div>
  );
};
