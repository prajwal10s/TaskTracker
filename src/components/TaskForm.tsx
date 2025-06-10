// src/components/TaskForm.tsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Important for DatePicker styling
import { api } from "~/utils/api"; // Assuming your tRPC client setup
import { TaskStatus, Priority, TaskWithRelations } from "~/types"; // Custom types for Taskify application
import LoadingSpinner from "./LoadingSpinner"; // Assuming you have a basic LoadingSpinner component

// --- Local Interfaces for form data consistency (matching backend tRPC input) ---
interface TaskFormInput {
  id?: string; // Optional for update operation
  title: string;
  description?: string; // Optional, corresponds to Zod's .optional()
  status: TaskStatus; // Corresponds to Zod enum
  priority: Priority; // Corresponds to Zod enum
  deadline?: string; // Expects string (ISO date) or undefined
  projectId?: string; // Optional, corresponds to Zod's .optional()
  assigneeId?: string; // Optional, corresponds to Zod's .optional()
  tagIds: string[]; // Array of tag IDs
}
// --------------------------------------------------------------------------------

interface TaskFormProps {
  initialData?: TaskWithRelations; // Optional: Task data to pre-fill form for editing
  onSuccess: () => void; // Callback function after successful submission (create/update)
  onCancel: () => void; // Callback for when the form is canceled/closed
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  // State variables for each form field
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
  // DatePicker works best with Date objects or null
  const [deadline, setDeadline] = useState<Date | null>(
    initialData?.deadline || null,
  );
  const [projectId, setProjectId] = useState<string | null>(
    initialData?.projectId || null,
  );
  const [assigneeId, setAssigneeId] = useState<string | null>(
    initialData?.assigneeId || null,
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags.map((tag) => tag.id) || [],
  );
  const [newTagName, setNewTagName] = useState(""); // State for new tag input

  const isEditing = !!initialData; // Determine if the form is in edit mode

  // --- tRPC Queries for dropdowns and tag creation ---
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = api.user.getAll.useQuery();
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = api.project.getAll.useQuery();
  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
    refetch: refetchTags,
  } = api.tag.getAll.useQuery();

  // --- tRPC Mutations for tasks and tags ---
  const createTagMutation = api.tag.create.useMutation({
    onSuccess: (newTag) => {
      setNewTagName(""); // Clear new tag input
      setSelectedTagIds((prev) => [...prev, newTag.id]); // Automatically select the new tag
      void refetchTags(); // Re-fetch tags to ensure UI is updated with the new tag
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      // Removed alert as per instructions, will display via hasError check
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      console.log("Task created successfully!");
      onSuccess(); // Trigger the success callback provided by parent
    },
    onError: (err) => {
      console.error("Error creating task:", err);
      // Removed alert
    },
  });

  const updateTaskMutation = api.task.update.useMutation({
    onSuccess: () => {
      console.log("Task updated successfully!");
      onSuccess(); // Trigger the success callback provided by parent
    },
    onError: (err) => {
      console.error("Error updating task:", err);
      // Removed alert
    },
  });

  // Effect to re-populate form fields when initialData changes (e.g., when editing a different task)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setStatus(initialData.status);
      setPriority(initialData.priority);
      setDeadline(initialData.deadline); // deadline is already a Date object from TaskWithRelations
      setProjectId(initialData.projectId || null);
      setAssigneeId(initialData.assigneeId || null);
      setSelectedTagIds(initialData.tags.map((tag) => tag.id));
    } else {
      // Reset form fields when no initialData is provided (e.g., creating a new task)
      setTitle("");
      setDescription("");
      setStatus(TaskStatus.TODO);
      setPriority(Priority.MEDIUM);
      setDeadline(null);
      setProjectId(null);
      setAssigneeId(null);
      setSelectedTagIds([]);
      setNewTagName("");
    }
  }, [initialData]);

  // Handle the main form submission (for both create and update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct task data, converting empty strings/nulls to undefined for optional fields
    // This matches Zod's .optional() behavior in tRPC inputs
    const taskData: TaskFormInput = {
      title,
      description: description.trim() === "" ? undefined : description,
      status,
      priority,
      deadline: deadline ? deadline.toISOString() : undefined, // Convert Date to ISO string
      projectId: projectId || undefined, // string or undefined
      assigneeId: assigneeId || undefined, // string or undefined
      tagIds: selectedTagIds,
    };

    console.log("Attempting to save task with data:", taskData); // Debugging log

    try {
      if (isEditing && initialData?.id) {
        // If editing, include the task ID in the mutation input
        await updateTaskMutation.mutateAsync({
          id: initialData.id,
          ...taskData,
        });
      } else {
        // If creating, just use the prepared taskData
        await createTaskMutation.mutateAsync(taskData);
      }
      // onSuccess is called within the mutation's onSuccess callback
    } catch (error) {
      // This catch block would only execute for errors not caught by the mutation's onError handler
      console.error(
        "Caught unexpected error during form submission (should be handled by mutation onError):",
        error,
      );
    }
  };

  // Handler for multi-select tag dropdown
  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setSelectedTagIds(options.map((option) => option.value));
  };

  // Handler for creating a new tag
  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) {
      // Replaced alert with console error/message
      console.error("Tag name cannot be empty.");
      return;
    }
    await createTagMutation.mutateAsync({ name: newTagName.trim() });
  };

  // Combine loading states for all tRPC queries and mutations
  const overallLoading =
    usersLoading ||
    projectsLoading ||
    tagsLoading ||
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    createTagMutation.isPending;

  // Combine error states for all tRPC queries and mutations
  const hasError =
    usersError ||
    projectsError ||
    tagsError ||
    createTaskMutation.isError ||
    updateTaskMutation.isError ||
    createTagMutation.isError;

  // Display a loading spinner if any data is still being fetched (and form is not yet visible)
  if (overallLoading && !isEditing) {
    // Only show full spinner if not editing (i.e. creating new)
    return <LoadingSpinner />;
  }

  // Display a combined error message if any tRPC operation failed
  if (hasError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        Error loading data or submitting:
        {usersError?.message ||
          projectsError?.message ||
          tagsError?.message ||
          createTaskMutation.error?.message ||
          updateTaskMutation.error?.message ||
          createTagMutation.error?.message}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg bg-white p-4 shadow-md"
    >
      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        />
      </div>

      {/* Description Field */}
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
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        ></textarea>
      </div>

      {/* Status Dropdown */}
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
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        >
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Dropdown */}
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
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        >
          {Object.values(Priority).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Deadline DatePicker */}
      <div>
        <label
          htmlFor="deadline"
          className="block text-sm font-medium text-gray-700"
        >
          Deadline
        </label>
        <DatePicker
          id="deadline"
          selected={deadline}
          onChange={(date: Date | null) => setDeadline(date)}
          dateFormat="Pp"
          showTimeSelect
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        />
      </div>

      {/* Project Dropdown */}
      <div>
        <label
          htmlFor="project"
          className="block text-sm font-medium text-gray-700"
        >
          Project
        </label>
        <select
          id="project"
          value={projectId || ""} // Handle null state for initial render
          onChange={(e) => setProjectId(e.target.value || null)} // Set to null if empty option selected
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        >
          <option value="">Select Project (Optional)</option>
          {projects?.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee Dropdown */}
      <div>
        <label
          htmlFor="assignee"
          className="block text-sm font-medium text-gray-700"
        >
          Assignee
        </label>
        <select
          id="assignee"
          value={assigneeId || ""} // Handle null state for initial render
          onChange={(e) => setAssigneeId(e.target.value || null)} // Set to null if empty option selected
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
        >
          <option value="">Select Assignee (Optional)</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email || "Unknown User"}
            </option>
          ))}
        </select>
      </div>

      {/* Tags Multi-select and New Tag Creation */}
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
          className="mt-1 block h-24 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled={overallLoading}
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
            disabled={overallLoading}
          />
          <button
            type="button"
            onClick={handleCreateNewTag}
            className="rounded-r-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            disabled={overallLoading || !newTagName.trim()} // Disable if form is submitting or input is empty
          >
            {createTagMutation.isPending ? "Adding..." : "Add New Tag"}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          disabled={overallLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={overallLoading}
        >
          {overallLoading
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Task"}
        </button>
      </div>
    </form>
  );
};
