import React, { useState, useRef, useEffect } from 'react';
import { Project, View } from '../types';
import { HomeIcon, DashboardIcon, MessageIcon, AnalyticsIcon, ReportIcon, PlusCircleIcon, ProjectIcon, ChevronDownIcon, SparklesIcon, LogoIcon, CalendarIcon, SearchIcon } from './icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUserRole: 'manager' | 'member';
  projects: Project[];
  currentProject: Project;
  onSwitchProject: () => void;
  onSelectProject: (projectId: string) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors duration-200 text-sm ${
        isActive
          ? 'bg-gray-700 text-white'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, currentUserRole, projects, currentProject, onSwitchProject, onSelectProject }) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsProjectDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  const filteredProjects = projects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const handleProjectSelect = (projectId: string) => {
      if (projectId !== currentProject.id) {
          onSelectProject(projectId);
      }
      setIsProjectDropdownOpen(false);
  };

  return (
    <nav className="w-64 bg-brand-primary p-4 flex flex-col shrink-0 space-y-4">
      <div className="flex items-center gap-2 px-2 pb-4 border-b border-gray-700">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <LogoIcon className="h-5 w-5" />
        </div>
        <h1 className="font-bold text-white text-lg">TaskGenius</h1>
      </div>

       <div className="space-y-1 relative" ref={dropdownRef}>
            <button onClick={() => setIsProjectDropdownOpen(prev => !prev)} className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 bg-primary rounded-md flex-shrink-0" />
                    <span className="font-semibold text-white text-sm truncate">{currentProject.name}</span>
                </div>
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProjectDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-brand-secondary rounded-lg shadow-lg z-10 p-2 animate-fadeIn">
                    <div className="relative mb-2">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input 
                            type="text"
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={e => setProjectSearch(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredProjects.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => handleProjectSelect(p.id)}
                                className={`w-full text-left flex items-center gap-2 p-2 rounded-md truncate text-sm transition-colors ${p.id === currentProject.id ? 'bg-primary text-white font-bold' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                                <ProjectIcon className="h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{p.name}</span>
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-gray-700 mt-2 pt-2">
                        <button onClick={onSwitchProject} className="w-full text-left flex items-center gap-2 p-2 rounded-md truncate text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                            <PlusCircleIcon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">All Projects / Lobby</span>
                        </button>
                    </div>
                </div>
            )}
       </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col space-y-1">
            <NavItem
            icon={HomeIcon}
            label="Home"
            isActive={activeView === View.Home}
            onClick={() => setActiveView(View.Home)}
            />
            <NavItem
            icon={DashboardIcon}
            label="My Tasks"
            isActive={activeView === View.Dashboard}
            onClick={() => setActiveView(View.Dashboard)}
            />
            <NavItem
            icon={CalendarIcon}
            label="Calendar"
            isActive={activeView === View.Calendar}
            onClick={() => setActiveView(View.Calendar)}
            />
            <NavItem
            icon={SparklesIcon}
            label="Inbox / AI"
            isActive={activeView === View.Chat}
            onClick={() => setActiveView(View.Chat)}
            />
             <NavItem
            icon={MessageIcon}
            label="Message"
            isActive={activeView === View.Message}
            onClick={() => setActiveView(View.Message)}
            />
            {currentUserRole === 'manager' && (
              <>
                <NavItem
                  icon={AnalyticsIcon}
                  label="Analytics"
                  isActive={activeView === View.Analytics}
                  onClick={() => setActiveView(View.Analytics)}
                />
                <NavItem
                    icon={ReportIcon}
                    label="Report"
                    isActive={activeView === View.Report}
                    onClick={() => setActiveView(View.Report)}
                />
              </>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;