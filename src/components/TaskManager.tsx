// src/components/TaskManager.tsx
import React, { useState, useEffect } from "react";
import { TaskList } from "./TaskList"; // TaskList remains a separate component for display
import DatePicker from "react-datepicker"; // You'll need to install this: `npm install react-datepicker @types/react-datepicker`
import "react-datepicker/dist/react-datepicker.css"; // Don't forget to import the CSS
import { api } from "~/utils/api"; // tRPC client setup
import { TaskStatus, Priority, TaskWithRelations } from "~/types"; // Ensure these types are defined in ~/types.ts or similar
import LoadingSpinner from "./LoadingSpinner"; // Assuming you have a basic LoadingSpinner component

interface TaskFormInput {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  deadline?: string;
  projectId?: string;
  assigneeId?: string;
  tagIds: string[];
}

export const TaskManager: React.FC = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);

  // --- Task Form State (always initialized for a new task) ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [deadline, setDeadline] = useState<Date | null>(null); // Date object for react-datepicker
  const [projectId, setProjectId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState(""); // State for new tag input

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

  const createTagMutation = api.tag.create.useMutation({
    onSuccess: (newTag) => {
      setNewTagName("");
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      void refetchTags();
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      alert(`Failed to create new tag: ${error.message}`);
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      // Here we Close the form and trigger list refetch
      console.log("Task created successfully!");
      handleTaskFormSuccess();
    },
    onError: (err) => {
      console.error("Error creating task:", err);
      alert(`Failed to create task: ${err.message}`);
    },
  });

  // Effect to reset form fields when form is opened for creation
  useEffect(() => {
    if (showTaskForm) {
      // Only reset when the form is *opened* for creation
      setTitle("");
      setDescription("");
      setStatus(TaskStatus.TODO);
      setPriority(Priority.LOW);
      setDeadline(null);
      setProjectId(null);
      setAssigneeId(null);
      setSelectedTagIds([]);
      setNewTagName("");
    }
  }, [showTaskForm]);

  const handleTaskFormSuccess = () => {
    setShowTaskForm(false);
    // TaskList handles its own refetch on change/mutation,
  };

  // Handle form submission (only create task)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: TaskFormInput = {
      title,
      description: description.trim() === "" ? undefined : description,
      status,
      priority,
      deadline: deadline ? deadline.toISOString() : undefined,
      projectId: projectId || undefined,
      assigneeId: assigneeId || undefined,
      tagIds: selectedTagIds,
    };

    console.log("Attempting to create task with data:", taskData); // Debugging log

    try {
      await createTaskMutation.mutateAsync(taskData);
      // onSuccess is called within the mutation's onSuccess callback
    } catch (error) {
      // This catch block would only execute for errors not caught by the mutation's onError handler
      console.error("Caught unexpected error during form submission:", error);
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
  };

  // Combine loading states for all tRPC queries and mutations
  const overallLoading =
    usersLoading ||
    projectsLoading ||
    tagsLoading ||
    createTaskMutation.isPending || // Only createTaskMutation is relevant now
    createTagMutation.isPending;

  // Combine error states for all tRPC queries and mutations
  const hasError =
    usersError ||
    projectsError ||
    tagsError ||
    createTaskMutation.isError || // Only createTaskMutation is relevant now
    createTagMutation.isError;

  // Display a loading spinner if any data is still being fetched (and form is not yet visible)
  if (overallLoading && !showTaskForm) {
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
              Create New Task {/* Simplified title */}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}{" "}
                  {/* Simplified button text */}
                </button>
              </div>

              {/* {createTaskMutation.isError && ( // Only check createTaskMutation error
                <p className="mt-4 text-sm text-red-500">
                  Error: {createTaskMutation.error?.message}
                </p>
              )} */}
            </form>
          </div>
        </div>
      )}

      {/* The TaskList component will fetch and display tasks */}
      <TaskList />
    </div>
  );
};
