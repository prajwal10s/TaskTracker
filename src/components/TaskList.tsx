// src/components/TaskList.tsx
import React from "react";
import { api } from "~/utils/api";
import { TaskCard } from "./TaskCard";
import { Task } from "@prisma/client";
import { TaskWithRelations, TaskWithTags } from "~/types";

interface TaskListProps {
  onEditTask: (task: TaskWithRelations) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onEditTask }) => {
  const {
    data: accessibleProjects,
    isLoading,
    isError,
    error,
  } = api.project.getAll.useQuery();

  const accessibleProjectIds = accessibleProjects?.map((proj) => proj.id) || [];

  const {
    data: tasks,
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
    error: tasksError,
    refetch, // refetch tasks when needed
  } = api.task.getAllForGivenProjects.useQuery(
    { projectIds: accessibleProjectIds }, // Pass the filtered project IDs
  );

  const handleTaskChange = () => {
    // This will refetch tasks after any task is updated or deleted,
    // ensuring the list is fresh based on current accessible projects.
    void refetch();
  };

  if (isErrorTasks) {
    return (
      <div className="text-center text-red-500">
        Error loading tasks: {tasksError.message}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    // Consider adding a message if no projects are accessible
    if (!accessibleProjects || accessibleProjects.length === 0) {
      return (
        <div className="text-center text-gray-600">
          You don't have access to any projects, or no projects exist.
        </div>
      );
    }
    return (
      <div className="text-center text-gray-600">
        No tasks found in your accessible projects. Create a new one!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task: TaskWithRelations) => (
        <TaskCard
          key={task.id}
          task={task}
          onTaskUpdated={handleTaskChange}
          onTaskDeleted={handleTaskChange}
          onEditClick={onEditTask}
        />
      ))}
    </div>
  );
};
