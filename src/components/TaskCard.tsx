import React from "react";
import { api } from "~/utils/api";
import Link from "next/link";
import { format } from "date-fns";
import { TaskWithRelations, TaskStatus, Priority } from "~/types";
import { getPriorityColor, getStatusColor } from "~/utils/styleUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TaskCardProps {
  task: TaskWithRelations;
  onTaskUpdated?: () => void; // Callback to refresh list after status update/delete
  onTaskDeleted?: () => void;
  onEditClick: (task: TaskWithRelations) => void; // Callback to trigger edit form
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskUpdated,
  onTaskDeleted,
  onEditClick,
}) => {
  const toggleTaskStatusMutation = api.task.update.useMutation({
    onSuccess: () => {
      onTaskUpdated?.();
    },
    onError: (err) => {
      console.error("Error toggling task status:", err);
      alert(`Failed to change status: ${err.message}`);
    },
  });

  const deleteTaskMutation = api.task.delete.useMutation({
    onSuccess: () => {
      onTaskDeleted?.();
    },
    onError: (err) => {
      console.error("Error deleting task:", err);
      alert(`Failed to delete task: ${err.message}`);
    },
  });

  const handleToggleStatus = () => {
    toggleTaskStatusMutation.mutate({
      id: task.id,
      // Cycle through status: TODO -> IN_PROGRESS -> DONE -> TODO
      status:
        task.status === TaskStatus.TODO
          ? TaskStatus.IN_PROGRESS
          : task.status === TaskStatus.IN_PROGRESS
            ? TaskStatus.DONE
            : TaskStatus.TODO,
      // Pass other required fields for update mutation
      title: task.title,
      description: task.description || undefined,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.toISOString() : undefined,
      projectId: task.projectId || undefined,
      assigneeId: task.assigneeId || undefined,
      tagIds: task.tags.map((tag) => tag.id),
    });
  };

  const handleDeleteTask = () => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      deleteTaskMutation.mutate({ id: task.id });
    }
  };

  const handleEditClick = () => {
    onEditClick(task); // Trigger the edit form in TaskManager
  };

  const isLoading =
    toggleTaskStatusMutation.isPending || deleteTaskMutation.isPending;

  return (
    <div
      className={`relative rounded-lg p-4 shadow-md ${
        task.status === TaskStatus.DONE
          ? "border-l-4 border-green-500 bg-gray-50 opacity-80"
          : "border-l-4 border-blue-500 bg-white"
      }`}
    >
      {/* Top Right Action Icons */}
      <div className="absolute right-3 top-3 flex space-x-2">
        {task.status === TaskStatus.DONE && (
          <span className="text-sm font-bold text-green-600">DONE</span>
        )}
        <button
          onClick={handleEditClick}
          className="rounded-md bg-gray-100 p-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
          aria-label="Edit Task"
        >
          <FontAwesomeIcon
            icon={["fas", "pencil-alt"]}
            className="text-black"
          />
        </button>

        <button
          onClick={handleDeleteTask}
          className="rounded-md bg-gray-100 p-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
          aria-label="Delete Task"
        >
          <FontAwesomeIcon icon={["fas", "trash"]} className="text-black" />
        </button>
      </div>

      <h3
        className={`mb-2 text-lg font-bold ${
          task.status === TaskStatus.DONE
            ? "text-gray-500 line-through"
            : "text-gray-800"
        }`}
      >
        {task.title}
      </h3>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-700">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${getStatusColor(task.status)}`}
        >
          {task.status.replace("_", " ")}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${getPriorityColor(task.priority)}`}
        >
          {task.priority.toUpperCase()}
        </span>
        {task.deadline && (
          <span className="flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
            🗓️ {format(new Date(task.deadline), "MMM d, h:mm a")}
          </span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleToggleStatus}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
            task.status === TaskStatus.IN_PROGRESS
              ? "bg-green-500 hover:bg-green-600"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={isLoading}
        >
          {isLoading
            ? "Updating..."
            : task.status === TaskStatus.IN_PROGRESS
              ? "Mark Done"
              : "Mark In Progress"}
        </button>

        <Link
          href={`/tasks/${task.id}`}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-800"
        >
          View
        </Link>
      </div>

      {(toggleTaskStatusMutation.isError || deleteTaskMutation.isError) && (
        <p className="mt-2 text-xs text-red-500">
          :{" "}
          {toggleTaskStatusMutation.error?.message ||
            deleteTaskMutation.error?.message}
        </p>
      )}
    </div>
  );
};
