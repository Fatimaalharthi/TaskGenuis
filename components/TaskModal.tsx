import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority, User, Subtask } from '../types';
import { TrashIcon, CloseIcon, PlusIcon, CheckIcon, XIcon, HourglassIcon } from './icons';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSave: (task: Omit<Task, 'id' | 'subtasks' | 'creationDate' | 'projectId'> & { id?: string; subtasks?: Subtask[] }) => void;
  onDelete: (taskId: string) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, subtaskTitle: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  currentUser: User;
  currentUserRole: 'manager' | 'member';
  onApproveChanges: (taskId: string) => void;
  onRejectChanges: (taskId: string) => void;
  users: User[];
}

const reminderOptions = [
  { label: 'No reminder', value: 0 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
  { label: '2 days before', value: 2880 },
  { label: '1 week before', value: 10080 },
];

const ChangeRow: React.FC<{field: string, original: any, changed: any}> = ({ field, original, changed }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-200">
        <span className="font-semibold text-gray-600 capitalize">{field}</span>
        <span className="md:col-span-1 text-gray-500 line-through">{String(original)}</span>
        <span className="md:col-span-1 text-green-700 font-semibold">{String(changed)}</span>
    </div>
);

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task, onSave, onDelete, onSubtaskToggle, onAddSubtask, onDeleteSubtask, currentUser, currentUserRole, onApproveChanges, onRejectChanges, users }) => {
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'subtasks' | 'creationDate' | 'projectId'>>({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    status: TaskStatus.ToDo,
    priority: TaskPriority.Medium,
    color: '#5B21B6',
    reminderOffset: 0,
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isPm = currentUserRole === 'manager';
  const hasPendingChanges = !!task?.pendingChanges;
  const isAssignee = task ? task.assignee === currentUser.name : true;
  const isReadOnly = !isPm && !isAssignee;

  const isFormDisabled = (hasPendingChanges && !isPm) || isReadOnly;
  const canEditSubtasks = task && !isReadOnly && (isPm || !hasPendingChanges);
  const canShowFooterActions = !hasPendingChanges && !isReadOnly;

  useEffect(() => {
    if (isOpen) {
        if (task) {
          setFormData({
            title: task.title,
            description: task.description,
            assignee: task.assignee,
            dueDate: task.dueDate,
            status: task.status,
            priority: task.priority,
            color: task.color || '#5B21B6',
            reminderOffset: task.reminderOffset || 0,
          });
        } else {
          setFormData({
            title: '',
            description: '',
            assignee: users[0]?.name || '',
            dueDate: new Date().toISOString().split('T')[0],
            status: TaskStatus.ToDo,
            priority: TaskPriority.Medium,
            color: '#5B21B6',
            reminderOffset: 0,
          });
        }
    }
  }, [task, isOpen, users]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'reminderOffset' ? parseInt(value, 10) : value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: task?.id, subtasks: task?.subtasks });
  };

  const handleDelete = () => {
    if (task && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };
  
  const handleApprove = () => { if (task) { onApproveChanges(task.id); onClose(); } };
  const handleReject = () => { if (task) { onRejectChanges(task.id); onClose(); } };

  const handleAddSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if(task && newSubtaskTitle.trim()){
          onAddSubtask(task.id, newSubtaskTitle);
          setNewSubtaskTitle('');
      }
  }

  const requester = users.find(u => u.id === task?.pendingChanges?.requestedByUserId);

  const renderApprovalSection = () => {
      if (!task || !hasPendingChanges) return null;
      if (isPm) {
          return (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg space-y-3">
              <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2"><HourglassIcon className="h-5 w-5" />Pending Approval from {requester?.name}</h3>
              <div className="text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-bold text-gray-500 uppercase">
                    <span>Field</span><span>Original Value</span><span>Proposed Value</span>
                </div>
                {Object.entries(task.pendingChanges!.changes).map(([key, value]) => (
                    <ChangeRow key={key} field={key} original={(task as any)[key]} changed={value} />
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button onClick={handleReject} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 font-semibold rounded-md hover:bg-red-200 transition-colors"><XIcon className="h-5 w-5"/> Reject</button>
                <button onClick={handleApprove} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-600 font-semibold rounded-md hover:bg-green-200 transition-colors"><CheckIcon className="h-5 w-5"/> Approve</button>
              </div>
            </div>
          );
      }
      return (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-center">
              <p className="font-semibold">Your changes are pending approval from the Project Manager.</p>
              <p className="text-sm">You cannot edit this task until the current changes are reviewed.</p>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-brand-bg rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-text">{task ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text"><CloseIcon className="h-6 w-6" /></button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {isReadOnly && (
            <div className="p-3 bg-blue-100/60 border border-blue-300/60 rounded-lg text-center text-sm">
                <p className="font-semibold text-blue-800">Read-Only Mode</p>
                <p className="text-blue-700">This task is assigned to another team member. You can view details but cannot make edits.</p>
            </div>
          )}
          {renderApprovalSection()}

          <form onSubmit={handleSave} className="space-y-4">
            <fieldset disabled={isFormDisabled} className={isFormDisabled ? 'opacity-50' : ''}>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input ref={titleInputRef} type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100" />
                </div>
                <div className="mt-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} required className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                        <select name="assignee" id="assignee" value={formData.assignee} onChange={handleChange} required disabled={!isPm} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100 disabled:cursor-not-allowed">
                        {users.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} required className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100">
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select name="priority" id="priority" value={formData.priority} onChange={handleChange} required className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100">
                        {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label htmlFor="reminderOffset" className="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
                    <select name="reminderOffset" id="reminderOffset" value={formData.reminderOffset || 0} onChange={handleChange} required className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100">
                        {reminderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="mt-4">
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Task Color</label>
                    <div className="flex items-center gap-2">
                        <input type="color" name="color" id="color" value={formData.color || '#5B21B6'} onChange={handleChange} className="w-10 h-10 p-0 bg-white border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed" />
                        <input type="text" name="color" value={formData.color || '#5B21B6'} onChange={handleChange} className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100" />
                    </div>
                </div>
            </fieldset>
          </form>

          {canEditSubtasks && (
             <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-brand-text mb-2">Checklist</h3>
                <div className="space-y-2">
                    {(task?.subtasks || []).map(subtask => (
                        <div key={subtask.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md group">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={subtask.completed} onChange={() => onSubtaskToggle(task.id, subtask.id)} className="h-4 w-4 rounded bg-gray-200 border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                <span className={`${subtask.completed ? 'line-through text-gray-400' : 'text-brand-text'}`}>{subtask.title}</span>
                            </label>
                            <button onClick={() => onDeleteSubtask(task.id, subtask.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete subtask"><TrashIcon className="h-4 w-4"/></button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddSubtask} className="flex gap-2 mt-3">
                    <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Add a new subtask..." className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent text-sm" />
                    <button type="submit" className="flex items-center justify-center p-2 bg-gray-200 rounded-md text-gray-600 hover:bg-brand-primary hover:text-white transition-colors" aria-label="Add subtask"><PlusIcon className="h-5 w-5" /></button>
                </form>
            </div>
          )}
        </main>
        {canShowFooterActions && (
            <footer className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div>
                {task && isPm && (
                <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 font-semibold rounded-md hover:bg-red-200 transition-colors">
                    <TrashIcon className="h-5 w-5" /> Delete
                </button>
                )}
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text font-semibold rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                <button type="submit" onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity">
                    {task ? 'Save Changes' : 'Create Task'}
                </button>
            </div>
            </footer>
        )}
      </div>
    </div>
  );
};

export default TaskModal;