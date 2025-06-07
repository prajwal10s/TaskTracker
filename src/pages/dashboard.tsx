import { type NextPage } from "next";
import Head from "next/head";
import { TaskForm } from "~/components/TaskForm";
import { TaskList } from "~/components/TaskList";
import { useState } from "react";

const DashboardPage: NextPage = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleTaskFormSuccess = () => {
    setShowTaskForm(false); // Close form on success
    // The TaskList component will automatically refetch thanks to its `useQuery`
    // Or you could explicitly invalidate the cache here if TaskList didn't manage its own refetch
  };

  return (
    <>
      <Head>
        <title>Dashboard - Taskify</title>
        <meta name="description" content="Manage your tasks with Taskify" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-4xl font-extrabold text-gray-800">
          Your Tasks
        </h1>

        <div className="mb-8 flex justify-end">
          <button
            onClick={() => setShowTaskForm(true)}
            className="rounded-md bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-green-700"
          >
            + Create New Task
          </button>
        </div>

        {showTaskForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg">
              <TaskForm
                onSuccess={handleTaskFormSuccess}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          </div>
        )}

        <TaskList />
      </div>
    </>
  );
};

export default DashboardPage;
