// src/pages/projects/[id].tsx
import { type NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { api } from "~/utils/api";
import { ProjectDetailView } from "~/components/ProjectDetailView"; // Import the ProjectDetailView component
import LoadingSpinner from "~/components/LoadingSpinner"; // Assuming you have this component

const ProjectDetailPage: NextPage = () => {
  const router = useRouter();
  const projectId = router.query.id as string; // Get project ID from URL

  // Fetch the specific project data
  // This assumes you have an `api.project.getById` tRPC procedure defined in your backend
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = api.project.getById.useQuery(
    { id: projectId },
    {
      enabled: !!projectId, // Only run query if projectId is available
    },
  );

  // Handle various loading and error states
  if (!projectId || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading project details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        Error loading project: {error.message}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-600">
        Project not found.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Project Details: {project.name} - Taskify</title>
        <meta
          name="description"
          content={`Details for project: ${project.name}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Project Details
          </h1>
          <button
            onClick={() => router.push("/projects")} // Navigate back to the main projects list page
            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
          >
            ← Back to Projects
          </button>
        </div>
        <div className="mx-auto max-w-2xl">
          {/* Render the ProjectDetailView component, passing the fetched project data */}
          <ProjectDetailView project={project} />
        </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;
