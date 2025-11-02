export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'focus';
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
}

export enum TaskStatus {
  Backlog = 'Backlog',
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done'
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id:string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string; // YYYY-MM-DD format
  status: TaskStatus;
  priority: TaskPriority;
  subtasks: Subtask[];
  creationDate: string;
  projectId: string;
  color?: string; // Custom color for the task
  reminderOffset?: number; // Reminder offset in minutes before due date
  pendingChanges?: {
    requestedByUserId: string;
    changes: Partial<Omit<Task, 'id' | 'subtasks' | 'creationDate' | 'pendingChanges' | 'history'>>;
  };
  history?: {
    timestamp: string;
    userId: string;
    action: 'CREATED' | 'EDIT_REQUESTED' | 'APPROVED' | 'REJECTED';
    details: string;
  }[];
}

export enum View {
  Home = 'home',
  Dashboard = 'dashboard', // My Tasks
  Calendar = 'calendar',
  Chat = 'chat', // Inbox
  Report = 'report',
  Message = 'message',
  Analytics = 'analytics'
}

export interface Notification {
  id: string;
  userId: string;
  taskId: string;
  message: string;
  timestamp: string; // ISO string
  isRead: boolean;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  text: string;
  timestamp: string; // ISO string
  chatId: string; // Can be projectId for team chat, or a composite key for private chats
}

export interface Invitation {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string; // ISO string
}

// FIX: Added missing Insight type definition.
export interface Insight {
  type: 'RISK' | 'WORKLOAD' | 'SUGGESTION' | 'POSITIVE';
  title: string;
  message: string;
  severity?: 'High' | 'Medium' | 'Low';
  actionableSuggestion?: string;
  relatedTaskIds: string[];
}
