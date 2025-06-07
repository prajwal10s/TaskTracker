// src/pages/tasks/[id].tsx
import { type NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { api } from "~/utils/api";
import { TaskDetailView } from "~/components/TaskDetailView"; // Import the TaskDetailView component
import LoadingSpinner from "~/components/LoadingSpinner"; // Assuming you have this component

const TaskDetailPage: NextPage = () => {
  const router = useRouter();
  const taskId = router.query.id as string; // Get task ID from URL

  // Fetch the specific task data
  const {
    data: task,
    isLoading,
    isError,
    error,
  } = api.task.getById.useQuery(
    { id: taskId },
    {
      enabled: !!taskId, // Only run query if taskId is available
    },
  );

  // Handle various loading and error states
  if (!taskId || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading task details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        Error loading task: {error.message}
      </div>
    );
  }

  if (!task) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-600">
        Task not found.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Task Details: {task.title} - Taskify</title>
        <meta name="description" content={`Details for task: ${task.title}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Task Details
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="mx-auto max-w-2xl">
          <TaskDetailView task={task} /> {/* Render the read-only view */}
        </div>
      </div>
    </>
  );
};

export default TaskDetailPage;
