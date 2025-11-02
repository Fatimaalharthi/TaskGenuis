import React, { useMemo, useRef, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, User } from '../types';
import { ChevronDownIcon } from './icons';

declare const Chart: any;

interface AnalyticsViewProps {
  tasks: Task[];
  users: User[];
}

const FilterButton: React.FC<{label: string}> = ({ label }) => (
    <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-sm text-brand-text font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors">
        {label}
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
    </button>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-96 flex flex-col">
        <h3 className="text-lg font-bold text-brand-text mb-4">{title}</h3>
        <div className="relative flex-1">
            {children}
        </div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string; subtext: string }> = ({ title, value, subtext }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <h3 className="font-bold text-lg text-brand-text">{title}</h3>
        <p className="text-4xl font-bold text-primary mt-4">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtext}</p>
    </div>
);


const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, users }) => {
    const completionOverTimeChartRef = useRef<HTMLCanvasElement>(null);
    const priorityDistributionChartRef = useRef<HTMLCanvasElement>(null);

    const analyticsData = useMemo(() => {
        const completionData: { [date: string]: number } = {};
        const creationData: { [date: string]: number } = {};

        tasks.forEach(task => {
            const creationDate = new Date(task.creationDate).toISOString().split('T')[0];
            creationData[creationDate] = (creationData[creationDate] || 0) + 1;

            if (task.status === TaskStatus.Done) {
                // NOTE: Task object doesn't have a completion date. Using dueDate as a proxy for completed tasks.
                const completionDate = new Date(task.dueDate).toISOString().split('T')[0];
                completionData[completionDate] = (completionData[completionDate] || 0) + 1;
            }
        });

        const sortedDates = [...new Set([...Object.keys(creationData), ...Object.keys(completionData)])].sort();
        
        let cumulativeCreated = 0;
        let cumulativeCompleted = 0;
        const cumulativeCreatedData = sortedDates.map(date => {
            cumulativeCreated += (creationData[date] || 0);
            return cumulativeCreated;
        });
        const cumulativeCompletedData = sortedDates.map(date => {
            cumulativeCompleted += (completionData[date] || 0);
            return cumulativeCompleted;
        });

        const priorityCounts = {
            [TaskPriority.Low]: tasks.filter(t => t.priority === TaskPriority.Low).length,
            [TaskPriority.Medium]: tasks.filter(t => t.priority === TaskPriority.Medium).length,
            [TaskPriority.High]: tasks.filter(t => t.priority === TaskPriority.High).length,
        };
        
        const completedTasks = tasks.filter(t => t.status === TaskStatus.Done);
        const lifespans = completedTasks.map(t => new Date(t.dueDate).getTime() - new Date(t.creationDate).getTime());
        const avgLifespanMs = lifespans.reduce((a, b) => a + b, 0) / (lifespans.length || 1);
        const avgLifespanDays = (avgLifespanMs / (1000 * 60 * 60 * 24)).toFixed(1);

        const dayCounts = [0,0,0,0,0,0,0];
        completedTasks.forEach(t => { const day = new Date(t.dueDate).getDay(); dayCounts[day]++; });
        const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const busiestDay = days[busiestDayIndex];

        const performers = users.map(u => ({ name: u.name, completed: tasks.filter(t => t.assignee === u.name && t.status === TaskStatus.Done).length }))
                              .sort((a,b) => b.completed - a.completed);
        const topPerformer = performers[0]?.completed > 0 ? performers[0].name : 'N/A';


        return {
            completionOverTime: {
                labels: sortedDates,
                created: cumulativeCreatedData,
                completed: cumulativeCompletedData
            },
            priorityDistribution: Object.values(priorityCounts),
            avgTaskLifespan: avgLifespanDays,
            busiestDay: busiestDay,
            topPerformer: topPerformer
        };
    }, [tasks, users]);

    useEffect(() => {
        Chart.defaults.color = '#374151'; // gray-700
        Chart.defaults.font.family = 'Inter, sans-serif';
        Chart.defaults.plugins.legend.position = 'top';
        
        const charts: any[] = [];
        
        if (completionOverTimeChartRef.current) {
            const completionChart = new Chart(completionOverTimeChartRef.current, {
                type: 'line',
                data: {
                    labels: analyticsData.completionOverTime.labels,
                    datasets: [
                        {
                            label: 'Tasks Created (Cumulative)',
                            data: analyticsData.completionOverTime.created,
                            borderColor: '#8B5CF6',
                            backgroundColor: '#8B5CF620',
                            fill: true,
                            tension: 0.3,
                        },
                        {
                            label: 'Tasks Completed (Cumulative)',
                            data: analyticsData.completionOverTime.completed,
                            borderColor: '#10B981',
                            backgroundColor: '#10B98120',
                            fill: true,
                            tension: 0.3,
                        }
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            charts.push(completionChart);
        }

        if (priorityDistributionChartRef.current) {
            const priorityChart = new Chart(priorityDistributionChartRef.current, {
                type: 'pie',
                data: {
                    labels: Object.values(TaskPriority),
                    datasets: [{
                        data: analyticsData.priorityDistribution,
                        backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444'],
                        borderColor: '#FFFFFF',
                        borderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
            charts.push(priorityChart);
        }

        return () => {
            charts.forEach(chart => chart?.destroy());
        };
    }, [analyticsData]);
    
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-2xl font-bold text-brand-text">No Task Data Available</h2>
                <p className="text-gray-500 mt-2">Create tasks to view analytics and track progress.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <header>
                <h2 className="text-3xl font-bold text-brand-text">Analytics Dashboard</h2>
                <p className="text-gray-500 mt-1">Dive deeper into your project's performance and trends.</p>
            </header>

            <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-100/50 rounded-xl border">
                <span className="font-semibold text-gray-600">Filters:</span>
                <FilterButton label="Date Range: All Time" />
                <FilterButton label="Assignees: All" />
                <FilterButton label="Priority: All" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Task Completion Over Time">
                    <canvas ref={completionOverTimeChartRef}></canvas>
                </ChartCard>
                 <ChartCard title="Task Distribution by Priority">
                    <canvas ref={priorityDistributionChartRef}></canvas>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Average Task Lifespan" value={`${analyticsData.avgTaskLifespan} days`} subtext="From creation to completion" />
                <StatCard title="Busiest Day" value={analyticsData.busiestDay} subtext="Most tasks completed" />
                <StatCard title="Top Performer" value={analyticsData.topPerformer} subtext="Most tasks completed" />
            </div>
        </div>
    );
};

export default AnalyticsView;