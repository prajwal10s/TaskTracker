import { useState, useEffect } from "react";
import { TaskStatus, Priority, TaskWithRelations } from "../types";
import { Task, Tag } from "@prisma/client";
import { api } from "../utils/api"; // Import tRPC client
import LoadingSpinner from "./LoadingSpinner"; //basic LoadingSpinner Function for graceful loading

interface TaskWithTags extends Task {
  tags: Tag[];
}

interface TaskFormProps {
  initialData?: TaskWithTags;
  onSuccess: (data: any) => void; // callback function to submit the task
  onCancel: () => void; // Callback for cancel action
}

export const TaskForm = ({
  initialData,
  onSuccess,
  onCancel,
}: TaskFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialData?.status || TaskStatus.TODO,
  );
  const [priority, setPriority] = useState<Priority>(
    initialData?.priority || Priority.MEDIUM,
  );
  const [deadline, setDeadline] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : "",
  );
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags.map((tag) => tag.id) || [],
  );
  const [newTagName, setNewTagName] = useState("");

  // Fetch users for assignee dropdown using tRPC
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = api.user.getAll.useQuery();

  // Fetch projects for project dropdown using tRPC
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = api.project.getAll.useQuery();

  // Fetch tags for tag selection using tRPC
  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
    refetch: refetchTags,
  } = api.tag.getAll.useQuery();

  // Mutation for creating a new tag
  const createTagMutation = api.tag.create.useMutation({
    onSuccess: (newTag) => {
      setNewTagName(""); // Clear new tag input
      // Add the newly created tag's ID to selected tags if it's not already there
      setSelectedTagIds((prev) => {
        if (!prev.includes(newTag.id)) {
          return [...prev, newTag.id];
        }
        return prev;
      });
      refetchTags(); // Re-fetch tags to ensure UI is updated with the new tag
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      alert(`Failed to create new tag: ${error.message}`);
    },
  });

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   onSuccess({
  //     title,
  //     description,
  //     status,
  //     priority,
  //     deadline: deadline ? new Date(deadline) : null, // Convert back to Date object for tRPC
  //     projectId: projectId || null, // Ensure null if empty string
  //     assigneeId: assigneeId || null, // Ensure null if empty string
  //     tagIds: selectedTagIds,
  //   });
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: TaskInput = {
      title,
      description: description || null, // Send null if empty, based on your Prisma/DB schema
      deadline: deadline, // Send Date object or null
      priority,
      tagIds: selectedTagIds,
      assigneeId: selectedAssigneeId, // Send assignee ID or null
      // Status is typically set on creation or updated separately
      status: initialData?.status || "TODO", // Default to TODO for creation or use existing status
    };

    console.log("Attempting to save task with data:", taskData); // Debug log

    try {
      if (isEditing && initialData?.id) {
        await updateTaskMutation.mutateAsync({
          id: initialData.id,
          ...taskData,
        });
      } else {
        await createTaskMutation.mutateAsync(taskData);
      }
      // onSuccess is called within the mutation's onSuccess callback
    } catch (error) {
      console.error(
        "Caught error during form submission (should be handled by mutation onError):",
        error,
      );
      // Specific UI error handling can go here if not handled by mutation hooks
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setSelectedTagIds(options.map((option) => option.value));
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) {
      alert("Tag name cannot be empty.");
      return;
    }
    createTagMutation.mutate({ name: newTagName.trim() });
  };

  if (usersLoading || projectsLoading || tagsLoading) {
    return <LoadingSpinner />;
  }

  if (usersError || projectsError || tagsError) {
    return (
      <div className="text-red-500">
        Error loading data:{" "}
        {usersError?.message || projectsError?.message || tagsError?.message}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg bg-white p-4 shadow-md"
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        ></textarea>
      </div>
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        >
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-gray-700"
        >
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        >
          {Object.values(Priority).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="deadline"
          className="block text-sm font-medium text-gray-700"
        >
          Deadline
        </label>
        <input
          type="date"
          id="deadline"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        />
      </div>
      <div>
        <label
          htmlFor="project"
          className="block text-sm font-medium text-gray-700"
        >
          Project
        </label>
        <select
          id="project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        >
          <option value="">Select Project (Optional)</option>
          {projects?.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="assignee"
          className="block text-sm font-medium text-gray-700"
        >
          Assignee
        </label>
        <select
          id="assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
        >
          <option value="">Select Assignee (Optional)</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700"
        >
          Tags
        </label>
        <select
          id="tags"
          multiple // Allow multiple selections
          value={selectedTagIds}
          onChange={handleTagChange}
          className="mt-1 block h-24 w-full rounded-md border border-gray-300 p-2 shadow-sm"
        >
          {tags?.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <div className="mt-2 flex">
          <input
            type="text"
            placeholder="New tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-grow rounded-l-md border border-gray-300 p-2 shadow-sm"
            disabled={createTagMutation.isPending}
          />
          <button
            type="button"
            onClick={handleCreateNewTag}
            className="rounded-r-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            disabled={createTagMutation.isPending || !newTagName.trim()}
          >
            {createTagMutation.isPending ? "Adding..." : "Add New Tag"}
          </button>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Save Task
        </button>
      </div>
    </form>
  );
};
