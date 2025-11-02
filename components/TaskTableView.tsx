import React from 'react';
import { Task, User, TaskStatus, TaskPriority } from '../types';

interface TaskTableViewProps {
  tasks: Task[];
  users: User[];
  onOpenTaskModal: (task: Task) => void;
}

const priorityStyles: Record<TaskPriority, string> = {
    [TaskPriority.High]: 'bg-red-100 text-red-800',
    [TaskPriority.Medium]: 'bg-yellow-100 text-yellow-800',
    [TaskPriority.Low]: 'bg-blue-100 text-blue-800',
};

const statusStyles: Record<TaskStatus, string> = {
    [TaskStatus.Backlog]: 'bg-gray-100 text-gray-800',
    [TaskStatus.ToDo]: 'bg-yellow-100 text-yellow-800',
    [TaskStatus.InProgress]: 'bg-purple-100 text-purple-800',
    [TaskStatus.Done]: 'bg-green-100 text-green-800',
};

const TaskTableView: React.FC<TaskTableViewProps> = ({ tasks, users, onOpenTaskModal }) => {
  const userMap = React.useMemo(() => new Map(users.map(u => [u.name, u])), [users]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Task Title</th>
              <th className="p-4 font-semibold text-gray-600">Assignee</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Priority</th>
              <th className="p-4 font-semibold text-gray-600">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const assignee = userMap.get(task.assignee);
              return (
                <tr
                  key={task.id}
                  onClick={() => onOpenTaskModal(task)}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 align-top">
                    <div className="font-medium text-brand-text">{task.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{task.description}</div>
                  </td>
                  <td className="p-4 align-top">
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <img src={assignee.avatar} alt={assignee.name} className="h-6 w-6 rounded-full" />
                        <span className="font-medium text-gray-700">{assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4 align-top font-medium text-gray-700">{task.dueDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tasks.length === 0 && (
            <div className="text-center p-8 text-gray-500">
                <p>No tasks to display in this view.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskTableView;
