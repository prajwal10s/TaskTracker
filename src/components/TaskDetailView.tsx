// src/components/TaskDetailView.tsx
import React from "react";
import { format } from "date-fns"; // You'll need to install this: `npm install date-fns`
import { TaskWithRelations } from "~/types"; // Ensure TaskWithRelations is defined in ~/types.ts

interface TaskDetailViewProps {
  task: TaskWithRelations;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({ task }) => {
  const getPriorityColor = (priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-500";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (
    status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
  ) => {
    switch (status) {
      case "TODO":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      case "BLOCKED":
        return "bg-green-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-3xl font-bold text-gray-800">{task.title}</h2>

      <p className="mb-4 text-gray-700">
        {task.description || "No description provided."}
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Status:</p>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(task.status)}`}
          >
            {task.status.replace("_", " ")}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Priority:</p>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getPriorityColor(task.priority)}`}
          >
            {task.priority.toUpperCase()}
          </span>
        </div>
        {task.deadline && (
          <div>
            <p className="text-sm font-medium text-gray-700">Deadline:</p>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
              🗓️ {format(new Date(task.deadline), "PPP p")}
            </span>
          </div>
        )}
        {task.project && (
          <div>
            <p className="text-sm font-medium text-gray-700">Project:</p>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800">
              📁 {task.project.name}
            </span>
          </div>
        )}
        {task.assignee && (
          <div>
            <p className="text-sm font-medium text-gray-700">Assigned To:</p>
            <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700">
              👤 {task.assignee.name || task.assignee.email || "N/A"}
            </span>
          </div>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">Tags:</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>Created: {format(new Date(task.createdAt), "PPP p")}</p>
        <p>Last Updated: {format(new Date(task.updatedAt), "PPP p")}</p>
      </div>
    </div>
  );
};
