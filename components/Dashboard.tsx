import React, { useMemo, useState } from 'react';
import { Task, User, TaskStatus, TaskPriority } from '../types';
import TaskCard from './TaskCard';
import { PlusIcon, KanbanIcon, TableIcon, UserPlusIcon } from './icons';
import ApprovalQueue from './ApprovalQueue';
import TaskTableView from './TaskTableView';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  users: User[];
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onOpenTaskModal: (task?: Task) => void;
  currentUserRole: 'manager' | 'member';
  onBulkApproveChanges: (taskIds: string[]) => void;
  onBulkRejectChanges: (taskIds: string[]) => void;
  onInviteClick: () => void;
}

type ViewMode = 'kanban' | 'table';

const Dashboard: React.FC<DashboardProps> = ({ 
    currentUser, 
    tasks, 
    users, 
    onTaskStatusChange, 
    onOpenTaskModal, 
    currentUserRole,
    onBulkApproveChanges,
    onBulkRejectChanges,
    onInviteClick,
}) => {
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const visibleTasks = useMemo(() => {
    return currentUserRole === 'manager' ? tasks : tasks.filter(task => task.assignee === currentUser.name);
  }, [tasks, currentUser, currentUserRole]);

  const tasksByStatus = useMemo(() => {
    return visibleTasks.reduce((acc, task) => {
      acc[task.status] = [...(acc[task.status] || []), task];
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [visibleTasks]);

  const tasksWithPendingChanges = useMemo(() => {
    return tasks.filter(t => t.pendingChanges);
  }, [tasks]);

  const statusColumns: TaskStatus[] = [TaskStatus.Backlog, TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Done];
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('taskId');
    if (taskId) {
        onTaskStatusChange(taskId, status);
    }
    setDraggedOverColumn(null);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = (status: TaskStatus) => setDraggedOverColumn(status);
  const handleDragLeave = () => setDraggedOverColumn(null);

  const renderViewSwitcher = () => (
    <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
      {(['kanban', 'table'] as ViewMode[]).map(mode => {
        const Icon = mode === 'kanban' ? KanbanIcon : TableIcon;
        return (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === mode ? 'bg-white text-brand-text shadow-sm' : 'text-gray-500 hover:text-brand-text'}`}
          >
            <Icon className="h-5 w-5" />
            <span className="capitalize">{mode}</span>
          </button>
        )
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
              <h2 className="text-2xl font-bold text-brand-text">My Tasks</h2>
              <p className="text-gray-500">Monitor all of your tasks here</p>
          </div>
          <div className="flex items-center gap-4">
            {renderViewSwitcher()}
            {currentUserRole === 'manager' && (
              <>
                <button
                  onClick={onInviteClick}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-brand-text font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors"
                  aria-label="Invite members"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Invite
                </button>
                <button 
                  onClick={() => onOpenTaskModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  aria-label="Add new task"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Task
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        {currentUserRole === 'manager' && tasksWithPendingChanges.length > 0 && (
          <ApprovalQueue 
            tasksWithPendingChanges={tasksWithPendingChanges}
            onReview={onOpenTaskModal}
            onBulkApprove={onBulkApproveChanges}
            onBulkReject={onBulkRejectChanges}
            users={users}
          />
        )}
        
        {viewMode === 'kanban' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex divide-x divide-gray-200 overflow-x-auto">
              {statusColumns.map(status => (
                <div 
                  key={status} 
                  className={`w-80 flex-shrink-0 flex flex-col transition-colors duration-300 ${draggedOverColumn === status ? 'bg-violet-50' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragEnter={() => handleDragEnter(status)}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-sm flex items-center text-gray-700">
                        {status}
                        <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{tasksByStatus[status]?.length || 0}</span>
                      </h3>
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto bg-gray-50/50 flex-1">
                    {(tasksByStatus[status] || []).map(task => 
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={() => onOpenTaskModal(task)}
                        users={users}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {viewMode === 'table' && (
          <TaskTableView 
            tasks={visibleTasks} 
            users={users} 
            onOpenTaskModal={onOpenTaskModal} 
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;