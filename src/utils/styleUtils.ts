export const getPriorityColor = (
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
) => {
  switch (priority) {
    case "LOW":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "HIGH":
      return "bg-red-100 text-red-800";
    case "URGENT":
      return "bg-red-500 text-black-500";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const getStatusColor = (
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
) => {
  switch (status) {
    case "TODO":
      return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS":
      return "bg-purple-100 text-purple-800";
    case "DONE":
      return "bg-green-100 text-green-800";
    case "BLOCKED":
      return "bg-green-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
