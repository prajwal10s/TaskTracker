import React, { useState } from "react";
import { api } from "~/utils/api";

interface ProjectInput {
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectFormProps {
  data: { id: string; name: string | null; email: string | null }[] | undefined;
  onSuccess: () => void; // Callback to run after successful project creation
  onCancel?: () => void; // Optional: Callback to handle form cancellation
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  data: users,
  onSuccess,
  onCancel,
}) => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Handler for multi-select users dropdown
  const handleUserChanges = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setSelectedUserIds(options.map((option) => option.value));
  };

  // tRPC mutation for creating a project
  const createProjectMutation = api.project.create.useMutation({
    onSuccess: () => {
      setProjectName(""); // Clear form fields
      setProjectDescription("");
      setSelectedUserIds([]);
      onSuccess(); // Call the success callback
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      await createProjectMutation.mutateAsync({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined, // Send undefined if empty
        members: selectedUserIds,
      });
    }
  };

  const isLoading = createProjectMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        Create New Project
      </h2>

      <div className="mb-4">
        <label
          htmlFor="projectName"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="projectName"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={isLoading}
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="projectDescription"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="projectDescription"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={isLoading}
        />
      </div>
      <select
        id="members"
        multiple // Allow multiple selections
        value={selectedUserIds}
        onChange={handleUserChanges}
        className="mt-1 block h-24 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
      >
        {users?.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading || !projectName.trim()}
        >
          {isLoading ? "Creating..." : "Create Project"}
        </button>
      </div>

      {createProjectMutation.isError && (
        <p className="mt-4 text-sm text-red-500">
          Error: {createProjectMutation.error?.message}
        </p>
      )}
    </form>
  );
};
