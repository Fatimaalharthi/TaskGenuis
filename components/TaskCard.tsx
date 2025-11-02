import React, { useState } from 'react';
import { Task, TaskPriority, User } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, HourglassIcon } from './icons';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  users: User[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, users }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const assignee = users.find(u => u.name === task.assignee);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    // Prevent dragging if there are pending changes
    if (task.pendingChanges) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('taskId', task.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const priorityStyles: Record<TaskPriority, { bg: string, text: string }> = {
    [TaskPriority.High]: { bg: 'bg-red-100', text: 'text-red-700' },
    [TaskPriority.Medium]: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    [TaskPriority.Low]: { bg: 'bg-blue-100', text: 'text-blue-700' },
  };

  const style = priorityStyles[task.priority] || priorityStyles[TaskPriority.Medium];


  return (
    <div 
      draggable={!task.pendingChanges}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ borderLeft: `3px solid ${task.color || '#5B21B6'}` }}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer active:cursor-grabbing flex flex-col justify-between animate-fadeIn ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'} ${task.pendingChanges ? 'cursor-not-allowed' : ''}`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              {task.priority}
            </span>
             {task.pendingChanges && (
                <div title="This task has pending changes awaiting approval.">
                    <HourglassIcon className="h-5 w-5 text-yellow-600 shrink-0" />
                </div>
            )}
        </div>
        <h4 className="font-semibold text-sm text-brand-text">{task.title}</h4>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {assignee && (
              <div className="relative shrink-0">
                  <img src={assignee.avatar} alt={assignee.name} className="h-6 w-6 rounded-full" title={assignee.name} />
                  <span
                      title={assignee.status.charAt(0).toUpperCase() + assignee.status.slice(1)}
                      className={`absolute -bottom-0.5 -right-0.5 block rounded-full w-2.5 h-2.5 ${
                          assignee.status === 'online' ? 'bg-green-500' :
                          assignee.status === 'focus' ? 'bg-primary' : 'bg-gray-400'
                      } ring-1 ring-white`}
                  />
              </div>
          )}
          {totalSubtasks > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircleIcon className="h-4 w-4" />
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
          )}
        </div>
        <span className="text-xs font-medium text-gray-500">{task.dueDate}</span>
      </div>
    </div>
  );
};

export default TaskCard;