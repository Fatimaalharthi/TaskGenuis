import React from 'react';
import { User, Project, Invitation } from '../types';
import { CloseIcon, PlusIcon, HourglassIcon } from './icons';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userId: string) => void;
  project: Project;
  allUsers: User[];
  invitations: Invitation[];
}

const InviteMembersModal: React.FC<InviteMembersModalProps> = ({ isOpen, onClose, onInvite, project, allUsers, invitations }) => {
  if (!isOpen) return null;

  const currentMemberIds = new Set([project.ownerId, ...project.memberIds]);
  const usersToInvite = allUsers.filter(user => !currentMemberIds.has(user.id));

  const pendingInvites = new Set(
    invitations
        .filter(inv => inv.projectId === project.id && inv.status === 'pending')
        .map(inv => inv.receiverId)
  );

  const handleInviteClick = (userId: string) => {
      onInvite(userId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-text">Invite Members to {project.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {usersToInvite.length > 0 ? (
            <ul className="space-y-2">
              {usersToInvite.map(user => {
                const isPending = pendingInvites.has(user.id);
                const statusTitle = user.status.charAt(0).toUpperCase() + user.status.slice(1);
                const statusColor = user.status === 'online' ? 'bg-green-500' : user.status === 'focus' ? 'bg-primary' : 'bg-gray-400';
                
                return (
                  <li key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                        <span
                            title={statusTitle}
                            className={`absolute bottom-0 right-0 block rounded-full w-2.5 h-2.5 ${statusColor} ring-2 ring-white`}
                        />
                      </div>
                      <div>
                          <p className="font-semibold text-brand-text">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {isPending ? (
                        <button disabled className="flex items-center justify-center p-2 text-yellow-600 font-semibold text-sm cursor-not-allowed" aria-label={`Invitation pending for ${user.name}`}>
                            <HourglassIcon className="h-5 w-5 mr-1" />
                            Pending
                        </button>
                    ) : (
                        <button onClick={() => handleInviteClick(user.id)} className="flex items-center justify-center p-2 bg-gray-200 rounded-md text-gray-600 hover:bg-brand-primary hover:text-white transition-colors" aria-label={`Invite ${user.name} to project`}>
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">All registered users are already in this project.</p>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-200 text-right">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:opacity-90"
            >
              Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;