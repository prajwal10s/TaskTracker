// src/pages/tasks/[id].tsx
import { type NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { TaskForm } from "~/components/TaskForm";
import { api } from "~/utils/api";

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

  const handleUpdateSuccess = () => {
    void router.push("/dashboard"); // Redirect back to dashboard after successful update
  };

  if (!taskId) {
    return (
      <div className="text-center text-gray-600">Loading task details...</div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-600">Loading task details...</div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Error loading task: {error.message}
      </div>
    );
  }

  if (!task) {
    return <div className="text-center text-gray-600">Task not found.</div>;
  }

  return (
    <>
      <Head>
        <title>Edit Task: {task.title} - Taskify</title>
        <meta
          name="description"
          content={`Edit details for task: ${task.title}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-4xl font-extrabold text-gray-800">
          Edit Task
        </h1>
        <div className="mx-auto max-w-2xl">
          <TaskForm
            initialData={task}
            onSubmit={handleUpdateSuccess}
            onCancel={() => router.push("/dashboard")}
          />
        </div>
      </div>
    </>
  );
};

export default TaskDetailPage;
