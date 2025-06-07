// src/components/TagManager.tsx
import React, { useState } from "react";
import { api } from "~/utils/api"; // Assuming your tRPC client setup

// --- Mock/Assumed tRPC Types (ensure these match your actual tRPC types) ---
interface Tag {
  id: string;
  name: string;
}
// -------------------------------------------------------------------------

export const TagManager: React.FC = () => {
  const [newTagName, setNewTagName] = useState("");

  const {
    data: tags,
    isLoading,
    isError,
    error,
    refetch,
  } = api.tag.getAll.useQuery();
  const createTagMutation = api.tag.create.useMutation({
    onSuccess: () => {
      setNewTagName("");
      void refetch(); // Refetch tags after successful creation
    },
  });
  const deleteTagMutation = api.tag.delete.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch tags after successful deletion
    },
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createTagMutation.mutate({ name: newTagName.trim() });
    }
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    if (confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      deleteTagMutation.mutate({ id: tagId });
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Manage Tags</h2>

      <form onSubmit={handleCreateTag} className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="New tag name"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="flex-grow rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={createTagMutation.isPending}
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={createTagMutation.isPending || !newTagName.trim()}
        >
          {createTagMutation.isPending ? "Adding..." : "Add Tag"}
        </button>
      </form>
      {createTagMutation.isError && (
        <p className="mb-4 text-sm text-red-500">
          Error adding tag: {createTagMutation.error?.message}
        </p>
      )}

      <h3 className="mb-3 text-lg font-semibold text-gray-700">
        Existing Tags:
      </h3>
      {isLoading ? (
        <p className="text-gray-600">Loading tags...</p>
      ) : isError ? (
        <p className="text-red-500">Error loading tags: {error.message}</p>
      ) : tags?.length === 0 ? (
        <p className="text-gray-600">No tags created yet.</p>
      ) : (
        <ul className="space-y-2">
          {tags?.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between rounded-md bg-gray-100 p-3"
            >
              <span className="text-gray-800">#{tag.name}</span>
              <button
                onClick={() => handleDeleteTag(tag.id, tag.name)}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                disabled={deleteTagMutation.isPending}
              >
                {deleteTagMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {deleteTagMutation.isError && (
        <p className="mt-4 text-sm text-red-500">
          Error deleting tag: {deleteTagMutation.error?.message}
        </p>
      )}
    </div>
  );
};
