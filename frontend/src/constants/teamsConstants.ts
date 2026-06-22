import type { Task } from "@/types/task";

export const initialTasks: Task[] = [
  {
    _id: "tdedc-rzerc", 
    taskId: "1",
    title: "Draft PR for WebRTC integration",
    description: "Create pull request for WebRTC integration feature",
    status: "todo",
    priority: "High",
    assignedTo: {
      _id: "1",
      name: "Alex J.",
      email: "alex@example.com"
    },
    dueDate: new Date("2024-12-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: "demo-project",
    projectName: "WebRTC Project"
  },
  {
    _id: "tdedc-rzuerc", 
    taskId: "2",
    title: "Design Dashboard Mobile UI",
    description: "Create responsive design for mobile dashboard",
    status: "in-progress",
    priority: "Medium",
    assignedTo: {
      _id: "2",
      name: "Sophie M.",
      email: "sophie@example.com"
    },
    dueDate: new Date("2024-12-15"),
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: "demo-project",
    projectName: "Dashboard Project"
  },
  {
    _id: "tdedc-rzeorc", 
    taskId: "3",
    title: "Fix JWT Token expiration bug",
    description: "Resolve issue with JWT tokens expiring too early",
    status: "done",
    priority: "Critical",
    assignedTo: {
      _id: "1",
      name: "Alex J.",
      email: "alex@example.com"
    },
    dueDate: new Date("2024-11-30"),
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: "demo-project",
    projectName: "Auth Project"
  },
  {
    _id: "tdedic-rzerc", 
    taskId: "4",
    title: "Prepare OpenAI prompt optimization",
    description: "Optimize prompts for better AI responses",
    status: "todo",
    priority: "Low",
    assignedTo: {
      _id: "3",
      name: "Maria K.",
      email: "maria@example.com"
    },
    dueDate: new Date("2024-12-20"),
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: "demo-project",
    projectName: "AI Project"
  }
];

export const priorityStyles: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Low: "bg-muted text-muted-foreground",
};

export const columnMeta: Record<string, { label: string; dot: string; bg: string }> = {
  todo: { label: "To Do", dot: "bg-muted-foreground", bg: "bg-muted/20" },
  "in-progress": { label: "In Progress", dot: "bg-amber-500", bg: "bg-amber-500/5" },
  "review": { label: "Review", dot: "bg-blue-500", bg: "bg-blue-500/5" },
  done: { label: "Done", dot: "bg-emerald-500", bg: "bg-emerald-500/5" },
};

export type FilterTab = "projects" | "team-tasks" | "project-tasks" | "board" | "members";
export type TaskStatus = "todo" | "in-progress" | "review" | "done";