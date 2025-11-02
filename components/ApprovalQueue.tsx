import React, { useState } from 'react';
import { Task, User } from '../types';
import { HourglassIcon, CheckIcon, XIcon } from './icons';

interface ApprovalQueueProps {
  tasksWithPendingChanges: Task[];
  onReview: (task: Task) => void;
  onBulkApprove: (taskIds: string[]) => void;
  onBulkReject: (taskIds: string[]) => void;
  users: User[];
}

const ConfirmationModal: React.FC<{
    count: number;
    action: 'approve' | 'reject';
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ count, action, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onCancel}>
        <div className="bg-white rounded-xl p-8 text-center shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-brand-text mb-2">Confirm Bulk Action</h3>
            <p className="text-gray-500 mb-6">
                You are about to <span className={`font-bold ${action === 'approve' ? 'text-green-600' : 'text-red-600'}`}>{action}</span> {count} pending edit(s).
                <br />
                This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="px-6 py-3 bg-gray-200 text-brand-text font-bold rounded-md hover:bg-gray-300 transition-all duration-200">
                    Cancel
                </button>
                <button onClick={onConfirm} className={`px-6 py-3 text-white font-bold rounded-md hover:opacity-90 transition-all duration-200 ${action === 'approve' ? 'bg-green-500' : 'bg-red-500'}`}>
                    Confirm
                </button>
            </div>
        </div>
    </div>
);


const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ tasksWithPendingChanges, onReview, onBulkApprove, onBulkReject, users }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  if (tasksWithPendingChanges.length === 0) {
    return null;
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(tasksWithPendingChanges.map(t => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectOne = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const handleConfirm = () => {
    if (confirmAction === 'approve') {
      onBulkApprove(selectedTaskIds);
    } else if (confirmAction === 'reject') {
      onBulkReject(selectedTaskIds);
    }
    setSelectedTaskIds([]);
    setConfirmAction(null);
  };

  const isAllSelected = selectedTaskIds.length === tasksWithPendingChanges.length && tasksWithPendingChanges.length > 0;
  const hasSelection = selectedTaskIds.length > 0;

  return (
    <>
      <div className="bg-yellow-100/50 border-2 border-yellow-300/60 rounded-xl p-6 shadow-glass animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <HourglassIcon className="h-7 w-7 text-yellow-700" />
          <h3 className="text-xl font-bold text-yellow-800">Pending Approvals ({tasksWithPendingChanges.length})</h3>
        </div>
        
        <div className="bg-white/40 p-3 rounded-lg border border-yellow-200 flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
                <input 
                    type="checkbox"
                    id="select-all-approvals"
                    className="h-5 w-5 rounded bg-gray-200 border-gray-300 text-brand-primary focus:ring-brand-primary"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                />
                <label htmlFor="select-all-approvals" className="font-semibold text-sm text-brand-text">
                    {hasSelection ? `${selectedTaskIds.length} Selected` : 'Select All'}
                </label>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setConfirmAction('approve')}
                    disabled={!hasSelection}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <CheckIcon className="h-4 w-4" />
                    Approve Selected
                </button>
                 <button
                    onClick={() => setConfirmAction('reject')}
                    disabled={!hasSelection}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <XIcon className="h-4 w-4" />
                    Reject Selected
                </button>
            </div>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {tasksWithPendingChanges.map(task => {
            const requester = users.find(u => u.id === task.pendingChanges?.requestedByUserId);
            return (
              <div key={task.id} className="bg-white/50 p-3 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <input 
                        type="checkbox"
                        className="h-5 w-5 rounded bg-gray-200 border-gray-300 text-brand-primary focus:ring-brand-primary"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleSelectOne(task.id)}
                    />
                    <div>
                        <p className="font-semibold text-brand-text">{task.title}</p>
                        <p className="text-sm text-gray-600">
                        Changes requested by <span className="font-medium">{requester?.name || 'Unknown User'}</span>
                        </p>
                    </div>
                </div>
                <button
                  onClick={() => onReview(task)}
                  className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
                >
                  Review
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {confirmAction && (
          <ConfirmationModal 
            count={selectedTaskIds.length}
            action={confirmAction}
            onConfirm={handleConfirm}
            onCancel={() => setConfirmAction(null)}
          />
      )}
    </>
  );
};

export default ApprovalQueue;