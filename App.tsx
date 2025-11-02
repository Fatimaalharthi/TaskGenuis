

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { USERS, PROJECTS } from './constants';
import { Task, User, View, TaskStatus, Subtask, Notification, Project, Invitation, ProjectMessage } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Chatbot from './components/Chatbot';
import UserSelector from './components/UserSelector';
import TaskModal from './components/TaskModal';
import ReportView from './components/ReportView';
import NotificationPanel from './components/NotificationPanel';
import { generateTasksFromFileContent, suggestFocusTasks } from './services/geminiService';
import { HourglassIcon } from './components/icons';
import FocusModeView from './components/FocusModeView';
import SearchBar from './components/SearchBar';
import AuthPage from './components/AuthPage';
import ProjectLobby from './components/ProjectLobby';
import InviteMembersModal from './components/InviteMembersModal';
import FileUpload from './components/FileUpload';
import MessageView from './components/MessageView';
import AnalyticsView from './components/AnalyticsView';

const HomeView: React.FC<{
  project: Project;
  tasks: Task[];
  users: User[];
}> = ({ project, tasks, users }) => {
    const stats = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.Done).length;
        const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Done).length;
        return {
            totalTasks,
            activeMembers: new Set(tasks.map(t => t.assignee)).size,
            completedTasks,
            overdueTasks,
        }
    }, [tasks]);

    const StatCard: React.FC<{title: string, value: number | string}> = ({ title, value }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm text-gray-500">{title}</h3>
            <p className="text-3xl font-bold text-brand-text">{value}</p>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-brand-text">Project Overview</h1>
            <p className="text-gray-500">A quick glance at the stats for '{project.name}'.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Tasks" value={stats.totalTasks} />
                <StatCard title="Active Members" value={stats.activeMembers} />
                <StatCard title="Completed Tasks" value={stats.completedTasks} />
                <StatCard title="Overdue Tasks" value={stats.overdueTasks} />
            </div>

            {/* In a real app, Assigned Tasks, Projects, People etc. would go here */}
        </div>
    );
}


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Home);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ isOpen: boolean; task?: Task; }>({ isOpen: false });
  const [projectBrief, setProjectBrief] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [focusSession, setFocusSession] = useState<{ tasks: Task[], duration: number } | null>(null);
  const [isFocusLoading, setIsFocusLoading] = useState(false);
  const [focusDurationModalOpen, setFocusDurationModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [projectNameConfirm, setProjectNameConfirm] = useState<{ newName: string; oldName: string } | null>(null);

  // Derived state based on selected project
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const currentUserRole = useMemo(() => {
      if (!selectedProject || !currentUser) return 'member';
      return selectedProject.ownerId === currentUser.id ? 'manager' : 'member';
  }, [selectedProject, currentUser]);
  const tasksForProject = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId), [tasks, selectedProjectId]);
  const userProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter(p => p.ownerId === currentUser.id || p.memberIds.includes(currentUser.id));
  }, [projects, currentUser]);


  useEffect(() => {
    fetch('/project_brief.txt')
      .then(response => response.text())
      .then(text => setProjectBrief(text))
      .catch(err => console.error("Failed to load initial project brief:", err));
  }, []);

    // When user switches, ensure they don't stay on a view they can't access
    useEffect(() => {
        if (currentUserRole !== 'manager' && (activeView === View.Report || activeView === View.Analytics)) {
            setActiveView(View.Dashboard);
        }
    }, [currentUserRole, activeView]);

  const addNotification = useCallback((newNotification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      setNotifications(prev => {
          const notification: Notification = {
              ...newNotification,
              id: `notif-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              isRead: false,
          };
          return [notification, ...prev].slice(0, 50);
      });
  }, []);

  // Effect to check for upcoming deadlines
  useEffect(() => {
    if (!currentUser) return;
    const checkDeadlines = () => {
      tasksForProject.forEach(task => {
        if (task.status !== TaskStatus.Done && task.reminderOffset && task.reminderOffset > 0) {
            const dueDate = new Date(task.dueDate);
            const reminderTime = new Date(dueDate.getTime() - task.reminderOffset * 60 * 1000);
            if (new Date() >= reminderTime && new Date() < dueDate) {
                const assigneeUser = users.find(u => u.name === task.assignee);
                if (assigneeUser) {
                    addNotification({ message: `Reminder: Task "${task.title}" is due soon.`, taskId: task.id, userId: assigneeUser.id });
                }
            }
        }
      });
    };
    const intervalId = setInterval(checkDeadlines, 60000);
    return () => clearInterval(intervalId);
  }, [tasksForProject, addNotification, currentUser, users]);

    // Simulate other users' presence
    useEffect(() => {
        if (!currentUser || users.length <= 1) return;

        const intervalId = setInterval(() => {
            setUsers(prevUsers => {
                const otherUsers = prevUsers.filter(u => u.id !== currentUser.id);
                if (otherUsers.length === 0) return prevUsers;

                const randomUserIndex = Math.floor(Math.random() * otherUsers.length);
                const userToUpdate = otherUsers[randomUserIndex];
                
                if (userToUpdate.status === 'focus') return prevUsers;
                
                const newStatus = userToUpdate.status === 'online' ? 'offline' : 'online';

                return prevUsers.map(u => u.id === userToUpdate.id ? { ...u, status: newStatus } : u);
            });
        }, 15000); // every 15 seconds

        return () => clearInterval(intervalId);
    }, [currentUser, users.length]);

  const handleTaskGeneration = useCallback(async (file: File) => {
    if (!selectedProject) return;
    setIsLoading(true);
    setError(null);
    try {
      const content = await file.text();
      setProjectBrief(content);
      const teamMemberUsers = users.filter(u => selectedProject.memberIds.includes(u.id) || selectedProject.ownerId === u.id);
      const teamMemberNames = teamMemberUsers.map(u => u.name);
      
      const { tasks: newTasks, projectName: newProjectName } = await generateTasksFromFileContent(content, teamMemberNames);
      
      if (newProjectName && newProjectName !== selectedProject.name) {
          setProjectNameConfirm({ newName: newProjectName, oldName: selectedProject.name });
      }

      const newTasksWithProject = newTasks.map(t => ({ ...t, projectId: selectedProject.id }));
      setTasks(prevTasks => [...prevTasks, ...newTasksWithProject]);
      
      newTasksWithProject.forEach(task => {
        const assigneeUser = users.find(u => u.name === task.assignee);
        if (assigneeUser) {
            addNotification({ message: `New task assigned via document upload: "${task.title}".`, taskId: task.id, userId: assigneeUser.id });
        }
      });
    } catch (err) {
      console.error("Task generation failed:", err);
      if (err instanceof Error && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429'))) {
          setError('API rate limit reached. Please wait a moment and try again.');
      } else {
          setError('Failed to generate tasks from the document. The format might be incorrect or the service is busy.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, users, selectedProject]);

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
    if (!currentUser) return;
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask || originalTask.status === newStatus) return;

    if (currentUserRole === 'manager') {
        let changedTask: Task | undefined;
        setTasks(prevTasks =>
          prevTasks.map(task => {
            if (task.id === taskId) {
                changedTask = { ...task, status: newStatus };
                return changedTask;
            }
            return task;
          })
        );
        if (changedTask) {
            const assigneeUser = users.find(u => u.name === changedTask!.assignee);
            if (assigneeUser) {
                addNotification({ message: `Task "${changedTask!.title}" status changed to ${newStatus}.`, taskId: changedTask!.id, userId: assigneeUser.id });
            }
        }
    } else {
        setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
                return { ...task, pendingChanges: { requestedByUserId: currentUser.id, changes: { ...task.pendingChanges?.changes, status: newStatus } }, history: [...(task.history || []), { userId: currentUser.id, timestamp: new Date().toISOString(), action: 'EDIT_REQUESTED', details: `Requested status change from "${task.status}" to "${newStatus}".` }] };
            }
            return task;
        }));
        addNotification({ message: `${currentUser.name} requested a status change for "${originalTask.title}".`, taskId: taskId, userId: 'pm' });
    }
  }, [addNotification, currentUser, tasks, users, currentUserRole]);
  
  const handleOpenModal = useCallback((task?: Task) => { setModalState({ isOpen: true, task }); }, []);
  const handleCloseModal = useCallback(() => { setModalState({ isOpen: false, task: undefined }); }, []);

  const handleSaveTask = useCallback((editedTaskData: Omit<Task, 'id' | 'subtasks' | 'creationDate' | 'projectId'> & { id?: string; subtasks?: Subtask[] }) => {
    if (!currentUser || !selectedProjectId) return;
    if (!editedTaskData.id) {
        const newTask: Task = {
            ...(editedTaskData as Omit<Task, 'id' | 'subtasks' | 'creationDate' | 'projectId'>),
            id: `task-${Date.now()}-${Math.random()}`,
            subtasks: [],
            creationDate: new Date().toISOString(),
            projectId: selectedProjectId,
            history: [{ userId: currentUser.id, timestamp: new Date().toISOString(), action: 'CREATED', details: 'Task created.' }]
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
        const assigneeUser = users.find(u => u.name === newTask.assignee);
        if (assigneeUser) {
            addNotification({ message: `You have been assigned a new task: "${newTask.title}".`, taskId: newTask.id, userId: assigneeUser.id });
        }
        handleCloseModal();
        return;
    }
    
    if (currentUserRole === 'manager') {
        setTasks(prevTasks => prevTasks.map(task => task.id === editedTaskData.id ? { ...task, ...editedTaskData } as Task : task));
        handleCloseModal();
        return;
    }

    const originalTask = tasks.find(t => t.id === editedTaskData.id);
    if (!originalTask) return;

    const changes: Partial<Omit<Task, 'id' | 'subtasks' | 'creationDate' | 'pendingChanges' | 'history'>> = {};
    (Object.keys(editedTaskData) as Array<keyof typeof editedTaskData>).forEach(key => {
        if (key !== 'id' && key !== 'subtasks' && editedTaskData[key] !== originalTask[key]) {
            (changes as any)[key] = editedTaskData[key];
        }
    });

    if (Object.keys(changes).length === 0) {
        handleCloseModal();
        return;
    }

    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === editedTaskData.id) {
            return { ...task, pendingChanges: { requestedByUserId: currentUser.id, changes: { ...task.pendingChanges?.changes, ...changes } }, history: [...(task.history || []), { userId: currentUser.id, timestamp: new Date().toISOString(), action: 'EDIT_REQUESTED' as const, details: `Requested changes: ${Object.keys(changes).join(', ')}.` }] };
        }
        return task;
    }));

    addNotification({ message: `${currentUser.name} requested changes for task "${originalTask.title}".`, taskId: originalTask.id, userId: selectedProject?.ownerId || 'pm' });
    handleCloseModal();

  }, [handleCloseModal, addNotification, currentUser, tasks, users, currentUserRole, selectedProjectId, selectedProject]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    handleCloseModal();
  }, [handleCloseModal]);

  const handleSubtaskToggle = useCallback((taskId: string, subtaskId: string) => {
      setTasks(prevTasks =>
          prevTasks.map(task => task.id === taskId ? { ...task, subtasks: task.subtasks.map(subtask => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask) } : task)
      );
  }, []);

  const handleAddSubtask = useCallback((taskId: string, subtaskTitle: string) => {
      setTasks(prevTasks =>
          prevTasks.map(task => {
              if (task.id === taskId && subtaskTitle.trim() !== '') {
                  const newSubtask: Subtask = { id: `subtask-${Date.now()}-${Math.random()}`, title: subtaskTitle.trim(), completed: false };
                  return { ...task, subtasks: [...task.subtasks, newSubtask] };
              }
              return task;
          })
      );
  }, []);

  const handleDeleteSubtask = useCallback((taskId: string, subtaskId: string) => {
      setTasks(prevTasks =>
          prevTasks.map(task => task.id === taskId ? { ...task, subtasks: task.subtasks.filter(st => st.id !== subtaskId) } : task)
      );
  }, []);

  const handleNotificationClick = useCallback((notificationId: string) => {
      let clickedTask: Task | undefined;
      setNotifications(prev =>
          prev.map(n => {
              if (n.id === notificationId) {
                  clickedTask = tasks.find(t => t.id === n.taskId);
                  return { ...n, isRead: true };
              }
              return n;
          })
      );
      if (clickedTask) handleOpenModal(clickedTask);
  }, [tasks, handleOpenModal]);

  const handleMarkAllAsRead = useCallback(() => { setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); }, []);

  const handleApproveChanges = useCallback((taskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || !taskToUpdate.pendingChanges) return;
    
    const { changes, requestedByUserId } = taskToUpdate.pendingChanges;
    setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, ...changes, pendingChanges: undefined, history: [...(task.history || []), { userId: currentUser!.id, timestamp: new Date().toISOString(), action: 'APPROVED', details: `Approved changes: ${Object.keys(changes).join(', ')}.` }] } as Task : task));
    addNotification({ message: `Your requested changes for "${taskToUpdate.title}" have been approved.`, taskId: taskId, userId: requestedByUserId });
  }, [tasks, addNotification, currentUser]);
  
  const handleRejectChanges = useCallback((taskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || !taskToUpdate.pendingChanges) return;
    const { changes, requestedByUserId } = taskToUpdate.pendingChanges;
    setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, pendingChanges: undefined, history: [...(task.history || []), { userId: currentUser!.id, timestamp: new Date().toISOString(), action: 'REJECTED', details: `Rejected changes: ${Object.keys(changes).join(', ')}.` }] } : task));
    addNotification({ message: `Your requested changes for "${taskToUpdate.title}" have been rejected.`, taskId: taskId, userId: requestedByUserId });
  }, [tasks, addNotification, currentUser]);

  const handleBulkApproveChanges = useCallback((taskIds: string[]) => {
    setTasks(prevTasks => {
        const updatedTasks = new Map(prevTasks.map(t => [t.id, t]));
        tasks.filter(t => taskIds.includes(t.id) && t.pendingChanges).forEach(taskToUpdate => {
            const { changes, requestedByUserId } = taskToUpdate.pendingChanges!;
            updatedTasks.set(taskToUpdate.id, { ...taskToUpdate, ...changes, pendingChanges: undefined, history: [...(taskToUpdate.history || []), { userId: currentUser!.id, timestamp: new Date().toISOString(), action: 'APPROVED' as const, details: `Approved changes: ${Object.keys(changes).join(', ')}.` }] } as Task);
            addNotification({ message: `Your requested changes for "${taskToUpdate.title}" have been approved.`, taskId: taskToUpdate.id, userId: requestedByUserId });
        });
        return Array.from(updatedTasks.values());
    });
  }, [tasks, addNotification, currentUser]);

  const handleBulkRejectChanges = useCallback((taskIds: string[]) => {
      setTasks(prevTasks => {
          const updatedTasks = new Map(prevTasks.map(t => [t.id, t]));
          tasks.filter(t => taskIds.includes(t.id) && t.pendingChanges).forEach(taskToUpdate => {
              const { changes, requestedByUserId } = taskToUpdate.pendingChanges!;
              updatedTasks.set(taskToUpdate.id, { ...taskToUpdate, pendingChanges: undefined, history: [...(taskToUpdate.history || []), { userId: currentUser!.id, timestamp: new Date().toISOString(), action: 'REJECTED' as const, details: `Rejected changes: ${Object.keys(changes).join(', ')}.` }] } as Task);
              addNotification({ message: `Your requested changes for "${taskToUpdate.title}" have been rejected.`, taskId: taskToUpdate.id, userId: requestedByUserId });
          });
          return Array.from(updatedTasks.values());
      });
  }, [tasks, addNotification, currentUser]);

  const handleConfirmProjectNameChange = useCallback(() => {
    if (!projectNameConfirm || !selectedProject) return;

    setProjects(prevProjects => prevProjects.map(p => 
        p.id === selectedProject.id ? { ...p, name: projectNameConfirm.newName } : p
    ));
    addNotification({ message: `Project name updated to "${projectNameConfirm.newName}".`, taskId: '', userId: selectedProject.ownerId });
    
    setProjectNameConfirm(null);
  }, [projectNameConfirm, selectedProject, addNotification]);

  const handleCancelProjectNameChange = useCallback(() => {
    setProjectNameConfirm(null);
  }, []);

  const handleStartFocusMode = async (duration: number) => {
    if (!currentUser) return;
    setFocusDurationModalOpen(false);
    setIsFocusLoading(true);
    setError(null); // Clear previous errors
    try {
        const userTasks = currentUserRole === 'manager' ? tasksForProject : tasksForProject.filter(t => t.assignee === currentUser.name);
        const suggestedTaskIds = await suggestFocusTasks(userTasks, duration);
        const suggestedTasks = tasksForProject.filter(task => suggestedTaskIds.includes(task.id));
        
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, status: 'focus' } : u));
        setCurrentUser(prev => prev ? { ...prev, status: 'focus' } : null);
        
        setFocusSession({ tasks: suggestedTasks, duration });
        setIsFocusModeActive(true);
    } catch (err) {
        console.error("Failed to start focus session:", err);
        if (err instanceof Error && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429'))) {
            setError("Could not get AI suggestions due to high traffic. Please try again in a moment.");
        } else {
            setError("Could not get AI suggestions for focus session. Please try again.");
        }
    } finally {
        setIsFocusLoading(false);
    }
  };

  const handleEndFocusMode = () => { 
      if(currentUser) {
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, status: 'online' } : u));
          setCurrentUser(prev => prev ? { ...prev, status: 'online' } : null);
      }
      setIsFocusModeActive(false); 
      setFocusSession(null); 
  };
  const handleTaskSelect = useCallback((task: Task) => { handleOpenModal(task); }, [handleOpenModal]);
  
  const handleLogin = (email: string): string | null => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) { 
        const userWithStatus = { ...user, status: 'online' as const };
        setUsers(prev => prev.map(u => u.id === user.id ? userWithStatus : u));
        setCurrentUser(userWithStatus); 
        return null; 
    }
    return "Invalid email or password.";
  };
  
  const handleSignUp = (name: string, email: string) => {
    const newUser: User = { id: `user-${Date.now()}`, name, email, avatar: `https://i.pravatar.cc/150?u=${email}`, status: 'online' };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };
  
  const handleLogout = () => { 
      if (currentUser) {
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, status: 'offline' } : u));
      }
      setCurrentUser(null); 
      setSelectedProjectId(null); 
      setActiveView(View.Home); 
  };
  
  const handleSelectProject = (projectId: string) => { setSelectedProjectId(projectId); setActiveView(View.Home); };
  const handleCreateProject = (projectName: string) => {
      if (!currentUser) return;
      const newProject: Project = { id: `proj-${Date.now()}`, name: projectName, ownerId: currentUser.id, memberIds: [] };
      setProjects(prev => [...prev, newProject]);
      setSelectedProjectId(newProject.id);
  };
  const handleBackToLobby = () => setSelectedProjectId(null);

  const handleSendInvitation = useCallback((receiverId: string) => {
    if (!selectedProjectId || !currentUser) return;

    const existingPending = invitations.some(inv => 
        inv.projectId === selectedProjectId && 
        inv.receiverId === receiverId && 
        inv.status === 'pending'
    );

    if (existingPending) {
        console.warn("Invitation already pending for this user and project.");
        return;
    }

    const newInvitation: Invitation = {
        id: `inv-${Date.now()}-${Math.random()}`,
        projectId: selectedProjectId,
        senderId: currentUser.id,
        receiverId,
        status: 'pending',
        timestamp: new Date().toISOString(),
    };
    setInvitations(prev => [...prev, newInvitation]);

    const receiver = users.find(u => u.id === receiverId);
    addNotification({
        message: `Invitation sent to ${receiver?.name || 'user'}.`,
        taskId: '', // No task associated
        userId: currentUser.id, // Notification for the sender
    });
  }, [selectedProjectId, currentUser, invitations, addNotification, users]);

  const handleAcceptInvitation = useCallback((invitationId: string) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation || !currentUser || invitation.receiverId !== currentUser.id) return;

    setProjects(prevProjects => prevProjects.map(p => 
        p.id === invitation.projectId 
        ? { ...p, memberIds: [...new Set([...p.memberIds, currentUser.id])] } 
        : p
    ));

    setInvitations(prevInvs => prevInvs.map(inv =>
        inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
    ));
  }, [invitations, currentUser]);

  const handleRejectInvitation = useCallback((invitationId: string) => {
    setInvitations(prevInvs => prevInvs.map(inv =>
        inv.id === invitationId ? { ...inv, status: 'rejected' } : inv
    ));
  }, []);

  const handleSendMessage = useCallback((text: string, chatId: string) => {
    if (!currentUser || !selectedProjectId || !text.trim()) return;

    const newMessage: ProjectMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      projectId: selectedProjectId,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      chatId: chatId,
    };

    setMessages(prev => [...prev, newMessage]);
  }, [currentUser, selectedProjectId]);

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} users={users} />;
  }
  
  if (!selectedProject) {
      const pendingInvitations = invitations.filter(inv => inv.receiverId === currentUser.id && inv.status === 'pending');
      return <ProjectLobby 
                user={currentUser} 
                projects={userProjects} 
                tasks={tasks}
                allProjects={projects}
                allUsers={users}
                invitations={pendingInvitations}
                onSelectProject={handleSelectProject} 
                onCreateProject={handleCreateProject} 
                onLogout={handleLogout} 
                onAcceptInvitation={handleAcceptInvitation}
                onRejectInvitation={handleRejectInvitation}
              />;
  }

  const renderContent = () => {
    const projectUsers = users.filter(u => selectedProject.ownerId === u.id || selectedProject.memberIds.includes(u.id));
    
    switch (activeView) {
      case View.Home:
        return <HomeView project={selectedProject} tasks={tasksForProject} users={projectUsers} />;
      case View.Dashboard:
        return <Dashboard 
                  currentUser={currentUser} 
                  tasks={tasksForProject} 
                  onFileUpload={handleTaskGeneration} 
                  isLoading={isLoading} 
                  error={error} 
                  onTaskStatusChange={handleTaskStatusChange} 
                  onOpenTaskModal={handleOpenModal}
                  onBulkApproveChanges={handleBulkApproveChanges}
                  onBulkRejectChanges={handleBulkRejectChanges}
                  users={projectUsers}
                  currentUserRole={currentUserRole}
                  onInviteClick={() => setIsInviteModalOpen(true)}
                />;
      case View.Calendar:
        return <div className="p-6 md:p-8"><CalendarView currentUser={currentUser} tasks={tasksForProject} currentUserRole={currentUserRole} /></div>;
      case View.Chat:
        return <div className="p-6 md:p-8 h-full"><Chatbot tasks={tasksForProject} projectBrief={projectBrief} currentUser={currentUser} /></div>;
      case View.Message:
        const messagesForProject = messages.filter(m => m.projectId === selectedProjectId);
        return <div className="p-6 md:p-8 h-full"><MessageView 
                    messages={messagesForProject} 
                    users={projectUsers} 
                    currentUser={currentUser!} 
                    onSendMessage={handleSendMessage} 
                    projectId={selectedProjectId}
                /></div>;
      case View.Report:
        return currentUserRole === 'manager' ? <div className="p-6 md:p-8"><ReportView tasks={tasksForProject} users={projectUsers} /></div> : <div>Access Denied</div>;
      case View.Analytics:
        return currentUserRole === 'manager' ? <div className="p-6 md:p-8"><AnalyticsView tasks={tasksForProject} users={projectUsers} /></div> : <div>Access Denied</div>;
      default:
        return <div>Not Found</div>;
    }
  };

  if (isFocusModeActive && focusSession) {
    return <FocusModeView session={focusSession} onEnd={handleEndFocusMode} onSubtaskToggle={handleSubtaskToggle} />;
  }
  
  const projectUsers = users.filter(u => selectedProject.ownerId === u.id || selectedProject.memberIds.includes(u.id));

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUserRole={currentUserRole}
        projects={userProjects}
        currentProject={selectedProject}
        onSwitchProject={handleBackToLobby}
        onSelectProject={handleSelectProject}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             {/* Can add breadcrumbs or title here if needed */}
          </div>
          <div className="flex items-center gap-4">
            <SearchBar tasks={tasksForProject} onTaskSelect={handleTaskSelect} />
            <button
              onClick={() => setFocusDurationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Enter Focus Mode"
            >
              <HourglassIcon className="h-5 w-5" />
              <span>Focus Mode</span>
            </button>
            <NotificationPanel notifications={notifications.filter(n => n.userId === currentUser.id || (currentUserRole === 'manager' && n.userId === selectedProject.ownerId))} onNotificationClick={handleNotificationClick} onMarkAllAsRead={handleMarkAllAsRead} />
            <UserSelector selectedUser={currentUser} onLogout={handleLogout} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {activeView === View.Home && currentUserRole === 'manager' && (
              <div className="p-6 md:p-8 border-b border-gray-200">
                <FileUpload onFileUpload={handleTaskGeneration} isLoading={isLoading} error={error} />
              </div>
          )}
          {renderContent()}
        </div>
      </main>
      <TaskModal isOpen={modalState.isOpen} task={modalState.task} onClose={handleCloseModal} onSave={handleSaveTask} onDelete={handleDeleteTask} onSubtaskToggle={handleSubtaskToggle} onAddSubtask={handleAddSubtask} onDeleteSubtask={handleDeleteSubtask} currentUser={currentUser} currentUserRole={currentUserRole} onApproveChanges={handleApproveChanges} onRejectChanges={handleRejectChanges} users={projectUsers} />
      
      {isInviteModalOpen && selectedProject && (
        <InviteMembersModal 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
          project={selectedProject} 
          allUsers={users} 
          onInvite={handleSendInvitation}
          invitations={invitations} 
        />
      )}

      {focusDurationModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={() => setFocusDurationModalOpen(false)}>
              <div className="bg-white rounded-xl p-8 text-center shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-brand-text mb-2">Enter Focus Mode</h3>
                  <p className="text-gray-500 mb-6">Select your desired duration for deep work.</p>
                  <div className="flex justify-center gap-4">
                      {[25, 50, 90].map(duration => (
                          <button key={duration} onClick={() => handleStartFocusMode(duration)} className="px-6 py-3 bg-primary text-white font-bold rounded-md hover:opacity-90 transition-all duration-200">
                              {duration} min
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {projectNameConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={handleCancelProjectNameChange}>
              <div className="bg-white rounded-xl p-8 text-center shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-brand-text mb-2">Confirm Project Name Change</h3>
                  <p className="text-gray-500 mb-6">
                      The uploaded document suggests a new name for this project.
                      <br />
                      Do you want to update it from <br />
                      "<span className="font-semibold">{projectNameConfirm.oldName}</span>" to "<span className="font-semibold text-primary">{projectNameConfirm.newName}</span>"?
                  </p>
                  <div className="flex justify-center gap-4">
                      <button onClick={handleCancelProjectNameChange} className="px-6 py-3 bg-gray-200 text-brand-text font-bold rounded-md hover:bg-gray-300 transition-all duration-200">
                          Keep Current Name
                      </button>
                      <button onClick={handleConfirmProjectNameChange} className="px-6 py-3 bg-primary text-white font-bold rounded-md hover:opacity-90 transition-all duration-200">
                          Update Name
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isFocusLoading && (
          <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-white mt-4">Preparing your focus session...</p>
          </div>
      )}
    </div>
  );
};

export default App;