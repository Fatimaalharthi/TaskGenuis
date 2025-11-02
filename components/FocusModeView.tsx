import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface FocusModeViewProps {
  session: {
    tasks: Task[];
    duration: number; // in minutes
  };
  onEnd: () => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
}

const FocusModeView: React.FC<FocusModeViewProps> = ({ session, onEnd, onSubtaskToggle }) => {
  const [timeLeft, setTimeLeft] = useState(session.duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Optional: Add a sound or visual cue when timer ends
      onEnd();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onEnd]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((session.duration * 60 - timeLeft) / (session.duration * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-brand-secondary text-white flex flex-col items-center justify-center p-8 animate-fadeIn">
      <div className="text-center w-full max-w-2xl">
        <div className="relative w-64 h-64 mx-auto mb-12">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-white/30" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className="text-white"
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 - (progress / 100) * (2 * Math.PI * 45)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold tracking-tighter">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Focus Session</h1>
        <p className="text-white/70 mb-8">Here are your suggested tasks. Stay focused and get it done.</p>

        <div className="space-y-4 text-left">
          {session.tasks.length > 0 ? (
            session.tasks.map(task => (
              <div key={task.id} className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30">
                <h3 className="font-bold text-lg">{task.title}</h3>
                {task.subtasks && task.subtasks.length > 0 && (
                   <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                     {task.subtasks.map(subtask => (
                        <label key={subtask.id} className="flex items-center gap-3 cursor-pointer p-1 rounded hover:bg-white/10">
                            <input 
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => onSubtaskToggle(task.id, subtask.id)}
                                className="h-4 w-4 rounded bg-white/20 border-white/30 text-brand-accent-light focus:ring-white shrink-0"
                            />
                            <span className={`${subtask.completed ? 'line-through text-white/70' : 'text-white'}`}>{subtask.title}</span>
                        </label>
                     ))}
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white/10 rounded-xl border border-white/20">
                <p className="text-white/70">No specific tasks were suggested. Enjoy your focused work time!</p>
            </div>
          )}
        </div>
        
        <button
          onClick={onEnd}
          className="mt-12 px-6 py-3 bg-red-500/50 text-white font-semibold rounded-md hover:bg-red-500/80 transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default FocusModeView;