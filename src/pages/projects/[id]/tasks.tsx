import { type NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { api } from "~/utils/api";
import { TaskList } from "~/components/TaskList"; // Import the TaskList component
import LoadingSpinner from "~/components/LoadingSpinner"; // Assuming you have this component
import { TaskWithRelations } from "~/types"; // Import TaskWithRelations type
import { TaskForm } from "~/components/TaskForm"; // Import the TaskForm component
import { useState } from "react"; // Import useState

const ProjectTasksPage: NextPage = () => {
  const router = useRouter();
  const projectId = router.query.id as string; // Get id for the projects from the URL
  console.log(router.query);
  // State to manage the visibility of the task form modal
  const [showTaskFormModal, setShowTaskFormModal] = useState(false);
  // State to hold the task data for editing (if in edit mode)
  const [taskToEdit, setTaskToEdit] = useState<TaskWithRelations | undefined>(
    undefined,
  );

  // Optionally fetch project details to display the project name
  const { data: project, isLoading: isLoadingProject } =
    api.project.getById.useQuery(
      { id: projectId },
      { enabled: !!projectId }, // Only fetch if projectId is available
    );

  // Get tRPC context for cache invalidation
  const trpcContext = api.useUtils();

  // If the project details are still loading or projectId isn't available yet
  if (!projectId || isLoadingProject) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading project tasks...</span>
      </div>
    );
  }

  // Handle case where project is not found after loading
  if (!project) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-600">
        Project not found.
      </div>
    );
  }

  // Callback function to handle editing a task from TaskList
  const handleEditTask = (task: TaskWithRelations) => {
    setTaskToEdit(task); // Set the task to pre-fill the form
    setShowTaskFormModal(true); // Open the modal
  };

  // Callback function after successful task creation/update
  const handleFormSuccess = () => {
    // Invalidate the specific query for tasks in this project to refetch and update the list
    void trpcContext.task.getAllForGivenProjects.invalidate({
      projectIds: [projectId],
    });
    setShowTaskFormModal(false); // Close the modal
    setTaskToEdit(undefined); // Clear task to edit state
  };

  // Callback function for canceling the form
  const handleFormCancel = () => {
    setShowTaskFormModal(false); // Close the modal
    setTaskToEdit(undefined); // Clear task to edit state
  };

  return (
    <>
      <Head>
        <title>Tasks for {project.name} - TaskTracker</title>
        <meta
          name="description"
          content={`Tasks associated with project: ${project.name}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Tasks for "{project.name}"
          </h1>
          <button
            onClick={() => router.push("/projects")} // Navigate back to the main projects list page
            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
          >
            ← Back to Projects
          </button>
        </div>
        <div className="mx-auto">
          {/* Repurpose TaskList to show tasks for this specific project */}
          <TaskList projectId={projectId} onEditTask={handleEditTask} />
        </div>
      </div>

      {/* Conditional rendering of the Task Form Modal for editing */}
      {showTaskFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">
              {taskToEdit ? "Edit Task" : "Create New Task"}
            </h2>
            <TaskForm
              initialData={taskToEdit} // Pass the task to be edited
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectTasksPage;
