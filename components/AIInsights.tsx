import React, { useState, useMemo } from 'react';
import { Insight, Task } from '../types';
import { SparklesIcon, ExclamationTriangleIcon, LightBulbIcon, UsersIcon, CheckBadgeIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface AIInsightsProps {
  insights: Insight[];
  tasks: Task[];
  onInsightClick: (taskIds: string[]) => void;
}

const InsightIcon: React.FC<{ type: Insight['type'] }> = ({ type }) => {
    switch (type) {
        case 'RISK':
            return <ExclamationTriangleIcon className="h-7 w-7 text-red-500" />;
        case 'WORKLOAD':
            return <UsersIcon className="h-7 w-7 text-blue-500" />;
        case 'SUGGESTION':
            return <LightBulbIcon className="h-7 w-7 text-yellow-500" />;
        case 'POSITIVE':
            return <CheckBadgeIcon className="h-7 w-7 text-green-500" />;
        default:
            return <SparklesIcon className="h-7 w-7 text-brand-primary" />;
    }
};

const SeverityBadge: React.FC<{ severity: Insight['severity'] }> = ({ severity }) => {
    if (!severity) return null;

    const styles = {
        High: 'bg-red-100 text-red-700',
        Medium: 'bg-yellow-100 text-yellow-700',
        Low: 'bg-blue-100 text-blue-700',
    };

    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[severity] || ''}`}>
            {severity} Severity
        </span>
    );
};


const AIInsights: React.FC<AIInsightsProps> = ({ insights, tasks, onInsightClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const taskMap = useMemo(() => new Map(tasks.map(task => [task.id, task.title])), [tasks]);

  if (insights.length === 0) {
    return null;
  }

  const nextInsight = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + insights.length) % insights.length);
  };
  
  const currentInsight = insights[currentIndex];

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-xl p-6 mb-6 animate-fadeIn border border-white/30 shadow-glass">
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-7 w-7 text-brand-primary" />
        <h3 className="text-xl font-bold text-brand-text">AI Co-Pilot Briefing</h3>
      </div>
      
      <div className="relative">
        {insights.length > 1 && (
            <button 
                onClick={prevInsight}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-1.5 bg-white/60 rounded-full hover:bg-white/90 transition-colors"
                aria-label="Previous insight"
            >
                <ChevronLeftIcon className="h-5 w-5 text-brand-text" />
            </button>
        )}

        <div className="bg-white/30 rounded-lg p-5 min-h-[180px] flex flex-col justify-center">
            <div key={currentIndex} className="animate-fadeIn">
                <div className="flex items-center gap-4 mb-3">
                    <InsightIcon type={currentInsight.type} />
                    <div className="flex-1">
                        <h4 className="font-bold text-lg text-brand-text">{currentInsight.title}</h4>
                    </div>
                    {currentInsight.type === 'RISK' && <SeverityBadge severity={currentInsight.severity} />}
                </div>

                <p className="text-gray-700 text-sm mb-3">{currentInsight.message}</p>
                
                {currentInsight.actionableSuggestion && (
                    <div className="flex items-start gap-2 text-sm text-brand-primary/80 bg-brand-primary/5 p-2 rounded-md">
                        <LightBulbIcon className="h-4 w-4 mt-0.5 shrink-0" />
                        <p><span className="font-semibold">Suggestion:</span> {currentInsight.actionableSuggestion}</p>
                    </div>
                )}

                {currentInsight.relatedTaskIds.length > 0 && (
                    <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-500 mb-2">RELATED TASKS</h5>
                        <div className="flex flex-wrap gap-2">
                            {currentInsight.relatedTaskIds.map(taskId => (
                                <button
                                    key={taskId}
                                    onClick={() => onInsightClick([taskId])}
                                    className="px-3 py-1 bg-white/70 text-brand-text text-sm font-medium rounded-full hover:bg-brand-accent hover:text-white transition-colors"
                                >
                                    {taskMap.get(taskId) || 'View Task'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {insights.length > 1 && (
            <button 
                onClick={nextInsight}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-1.5 bg-white/60 rounded-full hover:bg-white/90 transition-colors"
                aria-label="Next insight"
            >
                <ChevronRightIcon className="h-5 w-5 text-brand-text" />
            </button>
        )}
      </div>

      {insights.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentIndex === index ? 'bg-brand-primary' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to insight ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsights;