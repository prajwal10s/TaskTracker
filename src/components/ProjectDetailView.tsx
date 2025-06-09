import React from "react";
import { format } from "date-fns";
import { Project } from "@prisma/client";

interface ProjectDetailViewProps {
  project: Project;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
}) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">{project.name}</h2>
      </div>

      <p className="mb-4 text-gray-700">
        {project.description || "No description provided."}
      </p>
      <div className="mt-6 border-t pt-4 text-sm text-gray-500">
        <p>Created: {format(new Date(project.createdAt), "PPP p")}</p>
        <p>Last Updated: {format(new Date(project.updatedAt), "PPP p")}</p>
      </div>
    </div>
  );
};
