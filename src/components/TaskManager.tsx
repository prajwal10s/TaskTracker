// src/components/TaskManager.tsx
import React, { useState, useEffect } from "react";
import { TaskList } from "./TaskList"; // TaskList remains a separate component for display
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { api } from "~/utils/api"; // tRPC client setup
import { TaskStatus, Priority, TaskWithRelations } from "~/types"; // Ensure these types are defined in ~/types.ts or similar
import LoadingSpinner from "./LoadingSpinner"; // Assuming you have a basic LoadingSpinner component
import { getPriorityColor, getStatusColor } from "~/utils/styleUtils"; // Import centralized style utils

// --- Local Interfaces for form data consistency (matching backend tRPC input for creation/update) ---
interface TaskFormInput {
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

export const TaskManager: React.FC = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<
    TaskWithRelations | undefined
  >(undefined); // State for editing

  // --- Task Form State ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [deadline, setDeadline] = useState<Date | null>(null); // Date object for react-datepicker
  const [projectId, setProjectId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState(""); // State for new tag input

  const isEditing = !!initialTaskData; // Determine if the form is in edit mode

  // --- tRPC Queries for dropdowns and tag creation (now conditional) ---
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = api.user.getAll.useQuery(undefined, { enabled: showTaskForm }); // Only fetch when form is shown
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = api.project.getAll.useQuery(undefined, { enabled: showTaskForm }); // Only fetch when form is shown
  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
    refetch: refetchTags,
  } = api.tag.getAll.useQuery(undefined, { enabled: showTaskForm }); // Only fetch when form is shown

  // --- Get tRPC context for cache invalidation ---
  const trpcContext = api.useUtils();

  // --- tRPC Mutations for tasks and tags ---
  const createTagMutation = api.tag.create.useMutation({
    onSuccess: (newTag) => {
      setNewTagName("");
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      void refetchTags(); // Re-fetch tags to ensure UI is updated with the new tag
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      alert(`Failed to create new tag: ${error.message}`);
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      console.log("Task created successfully!");
      // --- IMPORTANT: Invalidate the task query to trigger a refetch in TaskList ---
      void trpcContext.task.getAllForGivenProjects.invalidate(); // Invalidate the specific query
      handleTaskFormSuccess(); // Close form
    },
    onError: (err) => {
      console.error("Error creating task:", err);
      alert(`Failed to create task: ${err.message}`);
    },
  });

  // Re-added updateTaskMutation for editing functionality
  const updateTaskMutation = api.task.update.useMutation({
    onSuccess: () => {
      console.log("Task updated successfully!");
      void trpcContext.task.getAllForGivenProjects.invalidate(); // Invalidate after update
      handleTaskFormSuccess(); // Close form
    },
    onError: (err) => {
      console.error("Error updating task:", err);
      alert(`Failed to update task: ${err.message}`);
    },
  });

  // Effect to populate form when `initialTaskData` changes (for editing)
  useEffect(() => {
    if (initialTaskData) {
      // Use initialTaskData for effect
      setTitle(initialTaskData.title);
      setDescription(initialTaskData.description || "");
      setStatus(initialTaskData.status);
      setPriority(initialTaskData.priority);
      setDeadline(initialTaskData.deadline);
      setProjectId(initialTaskData.projectId || null);
      setAssigneeId(initialTaskData.assigneeId || null);
      setSelectedTagIds(initialTaskData.tags.map((tag) => tag.id));
      setShowTaskForm(true); // Open the form automatically if initial data is provided
    } else {
      // Reset form fields when opening for a new task or if no initial data is provided
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
  }, [initialTaskData]); // Depend on initialTaskData

  // Handle successful form submission (from within TaskManager's form)
  const handleTaskFormSuccess = () => {
    setShowTaskForm(false);
    setInitialTaskData(undefined); // Clear initial data after successful submission
  };

  // Handle form submission (create/update task)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct task data, converting Date to ISO string and handling undefined for optional fields
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
      if (isEditing && initialTaskData?.id) {
        // Use initialTaskData
        await updateTaskMutation.mutateAsync({
          id: initialTaskData.id,
          ...taskData,
        });
      } else {
        await createTaskMutation.mutateAsync(taskData);
      }
    } catch (error) {
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
      alert("Tag name cannot be empty.");
      return;
    }
    await createTagMutation.mutateAsync({ name: newTagName.trim() });
  };

  const handleCancelForm = () => {
    setShowTaskForm(false);
    setInitialTaskData(undefined);
  };

  const handleEditTaskFromList = (task: TaskWithRelations) => {
    setInitialTaskData(task);
  };

  const overallLoading =
    usersLoading ||
    projectsLoading ||
    tagsLoading ||
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    createTagMutation.isPending;

  const hasError =
    usersError ||
    projectsError ||
    tagsError ||
    createTaskMutation.isError ||
    updateTaskMutation.isError ||
    createTagMutation.isError;

  if (overallLoading && !showTaskForm) {
    return <LoadingSpinner />;
  }

  if (hasError && showTaskForm) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        Error loading data or submitting:
        {usersError?.message ||
          projectsError?.message ||
          tagsError?.message ||
          createTaskMutation.error?.message ||
          updateTaskMutation.error?.message || // Display update error
          createTagMutation.error?.message}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Tasks</h2>
      <div className="mb-8 flex justify-end">
        <button
          onClick={() => {
            setInitialTaskData(undefined); // Ensure no initial data when creating new
            setShowTaskForm(true);
          }}
          className="rounded-md bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-green-700"
        >
          + Create New Task
        </button>
      </div>
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">
              {isEditing ? "Edit Task" : "Create New Task"}{" "}
              {/* Dynamic title */}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Fields */}
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

              <div>
                <label
                  htmlFor="project"
                  className="block text-sm font-medium text-gray-700"
                >
                  Project
                </label>
                <select
                  id="project"
                  value={projectId || ""}
                  onChange={(e) => setProjectId(e.target.value || null)}
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

              <div>
                <label
                  htmlFor="assignee"
                  className="block text-sm font-medium text-gray-700"
                >
                  Assignee
                </label>
                <select
                  id="assignee"
                  value={assigneeId || ""}
                  onChange={(e) => setAssigneeId(e.target.value || null)}
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
                  onClick={handleCancelForm}
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

              {/* Error Messages (if any mutation fails) */}
              {(createTaskMutation.isError || updateTaskMutation.isError) && (
                <p className="mt-4 text-sm text-red-500">
                  Error:{" "}
                  {createTaskMutation.error?.message ||
                    updateTaskMutation.error?.message}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
      {/* The TaskList component will fetch and display tasks */}
      <TaskList onEditTask={handleEditTaskFromList} />{" "}
      {/* Pass the edit callback */}
    </div>
  );
};
