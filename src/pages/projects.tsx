// src/pages/projects.tsx
import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { ProjectForm } from "~/components/ProjectForm"; // Import your new component
import { api } from "~/utils/api"; // For fetching projects
import { ProjectCard } from "~/components/ProjectCard";
interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
// -------------------------------------------------------------

const ProjectsPage: NextPage = () => {
  const [showProjectForm, setShowProjectForm] = useState(false);

  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = api.project.getAll.useQuery();

  const {
    data: users,
    isLoading: tagsLoading,
    error: tagsError,
    refetch: refetchUsers,
  } = api.user.getAll.useQuery(undefined, { enabled: showProjectForm });

  const handleProjectFormSuccess = () => {
    setShowProjectForm(false); // Close the form
    void refetch(); // Refetch projects to update the list
  };

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading projects...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Error loading projects: {error.message}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Projects - TaskTracker</title>
        <meta
          name="description"
          content="Manage your projects in TaskTracker"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-4xl font-extrabold text-gray-800">
          Your Projects
        </h1>

        <div className="mb-8 flex justify-end">
          <button
            onClick={() => setShowProjectForm(true)}
            className="rounded-md bg-slate-800 px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-slate-700"
          >
            + Create New Project
          </button>
        </div>

        {showProjectForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg">
              <ProjectForm
                data={users}
                onSuccess={handleProjectFormSuccess}
                onCancel={() => setShowProjectForm(false)}
              />
            </div>
          </div>
        )}

        {/* Displaying the list of projects */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-600">
              No projects found. Create one to get started!
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectsPage;
