import React, { useState, useCallback } from 'react';
import { Project, User, Invitation, Task } from '../types';
import { PlusIcon, CheckIcon, XIcon, LogoIcon, CloseIcon } from './icons';
import { generateProjectBrief } from '../services/geminiService';

interface ProjectLobbyProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  allProjects: Project[];
  allUsers: User[];
  invitations: Invitation[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: (projectName: string) => void;
  onLogout: () => void;
  onAcceptInvitation: (invitationId: string) => void;
  onRejectInvitation: (invitationId: string) => void;
}

const ProjectCreationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [projectName, setProjectName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreate(projectName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-brand-text mb-2">Create a New Project</h3>
          <p className="text-gray-500 mb-6">Give your new project a name to get started.</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g., Q4 Product Launch"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text font-semibold rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
              <button type="submit" disabled={!projectName.trim()} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:opacity-90 disabled:bg-gray-400">Create Project</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const ProjectCard: React.FC<{
  project: Project;
  role: 'Owner' | 'Member';
  onViewBrief: (project: Project) => void;
}> = ({ project, role, onViewBrief }) => {
  const roleStyles = {
    Owner: 'bg-green-100 text-green-700',
    Member: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="group [perspective:1000px]">
      <div 
        onClick={() => onViewBrief(project)}
        className="relative w-full h-48 bg-white/50 backdrop-blur-sm rounded-xl shadow-md border border-white/30 p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 [transform-style:preserve-3d] group-hover:[transform:rotateX(-5deg)_rotateY(5deg)_scale(1.05)] hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50"
      >
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg text-brand-text">{project.name}</h4>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleStyles[role]}`}>{role}</span>
        </div>
        <div 
            className="text-sm font-semibold text-primary self-start transition-transform group-hover:translate-x-1"
            aria-label={`View brief for ${project.name}`}
        >
            View Brief &rarr;
        </div>
      </div>
    </div>
  );
};

const ProjectBriefModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  brief: string;
  isLoading: boolean;
  onOpenProject: (projectId: string) => void;
}> = ({ isOpen, onClose, project, brief, isLoading, onOpenProject }) => {
  if (!isOpen || !project) return null;
  
  const renderBrief = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-brand-text mt-3 mb-1">$1</h3>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-text">Project Brief: {project.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text"><CloseIcon className="h-6 w-6" /></button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-600 mt-4">Generating project summary...</p>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: renderBrief(brief) }}></div>
          )}
        </main>
        <footer className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text font-semibold rounded-md hover:bg-gray-300 transition-colors">Close</button>
            <button onClick={() => onOpenProject(project.id)} disabled={isLoading} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:opacity-90 disabled:opacity-50">
                Open Project
            </button>
        </footer>
      </div>
    </div>
  );
};


const ProjectLobby: React.FC<ProjectLobbyProps> = ({ user, projects, tasks, allProjects, allUsers, invitations, onSelectProject, onCreateProject, onLogout, onAcceptInvitation, onRejectInvitation }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [selectedProjectForBrief, setSelectedProjectForBrief] = useState<Project | null>(null);
  const [briefContent, setBriefContent] = useState('');
  const [isBriefLoading, setIsBriefLoading] = useState(false);
  const [briefCache, setBriefCache] = useState<Record<string, string>>({});

  const ownedProjects = projects.filter(p => p.ownerId === user.id);
  const joinedProjects = projects.filter(p => p.ownerId !== user.id);

  const getProjectName = (projectId: string) => allProjects.find(p => p.id === projectId)?.name || 'Unknown Project';
  const getSenderName = (senderId: string) => allUsers.find(u => u.id === senderId)?.name || 'Unknown User';

  const handleViewBrief = useCallback(async (project: Project) => {
    setSelectedProjectForBrief(project);
    setBriefModalOpen(true);
    
    // Check cache first
    if (briefCache[project.id]) {
      setBriefContent(briefCache[project.id]);
      setIsBriefLoading(false);
      return;
    }

    setIsBriefLoading(true);
    setBriefContent(''); // Clear previous brief
    
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const brief = await generateProjectBrief(project, projectTasks);
    
    setBriefContent(brief);
    // Don't cache error messages to allow for retries
    if (!brief.toLowerCase().includes('unable') && !brief.toLowerCase().includes('busy')) {
        setBriefCache(prev => ({ ...prev, [project.id]: brief }));
    }
    setIsBriefLoading(false);
  }, [tasks, briefCache]);

  const closeBriefModal = () => {
    setBriefModalOpen(false);
    setSelectedProjectForBrief(null);
  };

  const handleOpenProject = (projectId: string) => {
    onSelectProject(projectId);
    closeBriefModal();
  };

  return (
    <>
      <div
        className="min-h-screen font-sans p-4 sm:p-8"
        style={{
            background: 'radial-gradient(circle at top, #f3e8ff, #f9fafb, white)'
        }}
       >
        <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <LogoIcon className="w-6 h-6"/>
              </div>
              <h1 className="text-2xl font-bold text-brand-text">TaskGenius</h1>
          </div>
          <button onClick={onLogout} className="font-semibold text-primary hover:underline">Sign Out</button>
        </header>
        
        <main className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-text">
                Welcome, <span className="bg-gradient-to-r from-primary to-violet-600 text-transparent bg-clip-text">{user.name}!</span>
              </h2>
              <p className="text-gray-600 mt-2 text-lg">Select a project to continue or create a new one.</p>
          </div>

          {invitations.length > 0 && (
            <div className="mb-10">
                <h3 className="text-2xl font-bold text-brand-text mb-4">Pending Invitations</h3>
                <div className="space-y-3">
                    {invitations.map(inv => (
                        <div key={inv.id} className="p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                            <div>
                                <p className="text-brand-text">
                                    You have been invited to join <span className="font-bold">{getProjectName(inv.projectId)}</span> by <span className="font-bold">{getSenderName(inv.senderId)}</span>.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onRejectInvitation(inv.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 font-semibold rounded-md hover:bg-red-200 transition-colors text-sm">
                                    <XIcon className="h-4 w-4" />
                                    Reject
                                </button>
                                <button onClick={() => onAcceptInvitation(inv.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 font-semibold rounded-md hover:bg-green-200 transition-colors text-sm">
                                    <CheckIcon className="h-4 w-4" />
                                    Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-brand-text pb-2 mb-6">My Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} role="Owner" onViewBrief={handleViewBrief} />
                ))}
                <div className="group [perspective:1000px]">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="w-full h-48 flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-all duration-300 [transform-style:preserve-3d] group-hover:[transform:rotateX(-5deg)_rotateY(5deg)_scale(1.05)] hover:shadow-glow-accent hover:bg-primary/5"
                    >
                        <PlusIcon className="h-8 w-8 mb-2" />
                        <span className="font-semibold">Create New Project</span>
                    </button>
                </div>
              </div>
            </div>
            
            {joinedProjects.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-brand-text pb-2 mb-6">Joined Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedProjects.map(project => (
                    <ProjectCard key={project.id} project={project} role="Member" onViewBrief={handleViewBrief} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <ProjectCreationModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={onCreateProject} />
      <ProjectBriefModal 
        isOpen={briefModalOpen}
        onClose={closeBriefModal}
        project={selectedProjectForBrief}
        brief={briefContent}
        isLoading={isBriefLoading}
        onOpenProject={handleOpenProject}
      />
    </>
  );
};

export default ProjectLobby;