import React from "react";
import Link from "next/link"; // Import Link for navigation
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons"; // Specific icon import for React component

// Define the minimal interface for a project needed by this card
interface Project {
  id: string;
  name: string;
  description?: string | null; // Optional description
  // Add any other properties here that you might want to display on the card later
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-xl font-bold text-gray-800">{project.name}</h3>
      <Link
        href={`/projects/${project.id}`} // Links to the dynamic project detail page
        className="mr-2 inline-block rounded-md bg-yellow-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-yellow-600"
      >
        Details
      </Link>
      <Link
        href={`/projects/${project.id}/tasks`} // Links to the dynamic project detail page
        className="inline-block rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-600"
      >
        View All Tasks
      </Link>
    </div>
  );
};
