import React from "react";
import { api } from "~/utils/api";
import { TaskCard } from "./TaskCard";
import { Task } from "@prisma/client";
import { TaskWithRelations, TaskWithTags } from "~/types";
import { useSession } from "next-auth/react";

interface TaskListProps {
  onEditTask: (task: TaskWithRelations) => void;
  projectId?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  onEditTask,
  projectId,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {
    data: tasks,
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
    error: tasksError,
    refetch,
  } = api.task.getAll.useQuery(
    projectId ? { projectId } : { assigneeId: userId },
    {
      enabled: !!(projectId || userId), // Only fetch if projectId or userId is available
    },
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

  if (!tasks) {
    // Consider adding a message if no projects are accessible
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
