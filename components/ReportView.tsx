import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Task, TaskStatus, TaskPriority, User } from '../types';
import * as jspdf from 'jspdf';
import { DownloadIcon, EmailIcon } from './icons';
import EmailReportModal from './EmailReportModal';

// Add a declaration for the Chart object from the CDN script
declare const Chart: any;

interface ReportViewProps {
  tasks: Task[];
  users: User[];
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-glass border border-white/30 p-6 h-96 flex flex-col">
        <h3 className="text-xl font-bold text-brand-text mb-4 text-center">{title}</h3>
        <div className="relative flex-1">
            {children}
        </div>
    </div>
);

const ReportView: React.FC<ReportViewProps> = ({ tasks, users }) => {
    const overallProgressChartRef = useRef<HTMLCanvasElement>(null);
    const statusBreakdownChartRef = useRef<HTMLCanvasElement>(null);
    const teamWorkloadChartRef = useRef<HTMLCanvasElement>(null);
    const priorityBreakdownChartRef = useRef<HTMLCanvasElement>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const chartData = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.Done).length;

        const statusCounts = {
            [TaskStatus.Backlog]: tasks.filter(t => t.status === TaskStatus.Backlog).length,
            [TaskStatus.ToDo]: tasks.filter(t => t.status === TaskStatus.ToDo).length,
            [TaskStatus.InProgress]: tasks.filter(t => t.status === TaskStatus.InProgress).length,
            [TaskStatus.Done]: tasks.filter(t => t.status === TaskStatus.Done).length,
        };
        
        const teamMembers = users.filter(u => u.id !== 'pm');
        const workload = teamMembers.map(member => ({
            name: member.name,
            count: tasks.filter(t => t.assignee === member.name).length,
        }));

        const priorityCounts = {
            [TaskPriority.Low]: tasks.filter(t => t.priority === TaskPriority.Low).length,
            [TaskPriority.Medium]: tasks.filter(t => t.priority === TaskPriority.Medium).length,
            [TaskPriority.High]: tasks.filter(t => t.priority === TaskPriority.High).length,
        };

        return {
            overallProgress: [completedTasks, totalTasks > 0 ? totalTasks - completedTasks : 0],
            statusBreakdown: Object.values(statusCounts),
            teamWorkload: {
                labels: workload.map(w => w.name),
                data: workload.map(w => w.count),
            },
            priorityBreakdown: Object.values(priorityCounts),
        };
    }, [tasks, users]);

    const sortedTeamWorkload = useMemo(() => {
        const teamMembers = users.filter(u => u.id !== 'pm');
        const workload = teamMembers.map(member => ({
            name: member.name,
            avatar: member.avatar,
            count: tasks.filter(t => t.assignee === member.name).length,
        }));
        
        return workload.sort((a, b) => b.count - a.count);
    }, [tasks, users]);

    useEffect(() => {
        Chart.defaults.color = '#222222';
        Chart.defaults.font.family = 'Poppins, Inter, sans-serif';
        Chart.defaults.plugins.legend.position = 'bottom';
        Chart.defaults.plugins.tooltip.backgroundColor = '#ffffff';
        Chart.defaults.plugins.tooltip.titleColor = '#222222';
        Chart.defaults.plugins.tooltip.bodyColor = '#222222';
        Chart.defaults.plugins.tooltip.borderColor = '#dddddd';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' };
        Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
        
        const chartRefs = [
            overallProgressChartRef,
            statusBreakdownChartRef,
            teamWorkloadChartRef,
            priorityBreakdownChartRef,
        ];

        const chartConfigs = [
            // Overall Progress (Doughnut)
            {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending'],
                    datasets: [{ data: chartData.overallProgress, backgroundColor: ['#5B21B6', '#C4B5FD'], borderColor: '#F8F9FA', borderWidth: 3 }],
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} tasks (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            },
            // Status Breakdown (Pie)
            {
                type: 'pie',
                data: {
                    labels: Object.values(TaskStatus),
                    datasets: [{ data: chartData.statusBreakdown, backgroundColor: ['#E5E7EB', '#facc15', '#8B5CF6', '#5B21B6'], borderColor: '#F8F9FA', borderWidth: 3 }],
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} tasks (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            },
            // Team Workload (Bar)
            {
                type: 'bar',
                data: {
                    labels: chartData.teamWorkload.labels,
                    datasets: [{ label: 'Tasks Assigned', data: chartData.teamWorkload.data, backgroundColor: '#5B21B6', borderRadius: 4 }],
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    const value = context.raw || 0;
                                    return `${value} tasks assigned`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            grid: { color: '#00000010' },
                            ticks: {
                                stepSize: 1,
                                precision: 0
                            },
                            beginAtZero: true
                        },
                        y: { grid: { display: false } }
                    }
                }
            },
            // Priority Breakdown (Bar)
            {
                type: 'bar',
                data: {
                    labels: Object.values(TaskPriority),
                    datasets: [{ label: 'Task Count', data: chartData.priorityBreakdown, backgroundColor: ['#C4B5FD', '#5B21B6', '#4C1D95'], borderRadius: 4 }],
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    const value = context.raw || 0;
                                    return `${value} tasks`;
                                }
                            }
                        }
                    },
                     scales: {
                        x: { grid: { display: false } },
                        y: { 
                            grid: { color: '#00000010' },
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                precision: 0,
                            },
                        }
                    }
                }
            }
        ];

        const chartInstances = chartRefs.map((ref, index) => {
            if (ref.current) {
                return new Chart(ref.current, chartConfigs[index]);
            }
            return null;
        });

        return () => {
            chartInstances.forEach(chart => chart?.destroy());
        };
    }, [chartData]);
    
    const generatePdfDoc = useCallback(() => {
        const doc = new jspdf.jsPDF('p', 'mm', 'a4');
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('Project Status Report', pageWidth / 2, margin, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString(), pageWidth / 2, margin + 8, { align: 'center' });

        const chartRefs = [
            { ref: overallProgressChartRef, title: 'Overall Progress' },
            { ref: statusBreakdownChartRef, title: 'Task Status Breakdown' },
            { ref: teamWorkloadChartRef, title: 'Team Workload' },
            { ref: priorityBreakdownChartRef, title: 'Tasks by Priority' }
        ];

        let y = margin + 20;

        chartRefs.forEach(({ ref, title }, index) => {
            if (ref.current) {
                const canvas = ref.current;
                const imgData = canvas.toDataURL('image/png', 1.0);
                
                const imgWidth = 85;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const x = (index % 2 === 0) ? margin : pageWidth - imgWidth - margin;
                
                if (y + imgHeight + 20 > doc.internal.pageSize.getHeight() - margin && index > 0) {
                    doc.addPage();
                    y = margin;
                }
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(title, x, y);

                doc.addImage(imgData, 'PNG', x, y + 5, imgWidth, imgHeight);

                if (index % 2 !== 0) {
                    y += imgHeight + 25;
                }
            }
        });
        
        y += 10;

        if (y > doc.internal.pageSize.getHeight() - margin - 30) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Team Workload Details', margin, y);
        y += 10;

        const drawTableHeader = () => {
            doc.setFontSize(12);
            doc.setDrawColor(100, 100, 100);
            doc.line(margin, y + 2, pageWidth - margin, y + 2);
            doc.setFont('helvetica', 'bold');
            doc.text('Assignee', margin, y);
            doc.text('Tasks Assigned', pageWidth - margin, y, { align: 'right' });
            y += 8;
        };

        drawTableHeader();
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        sortedTeamWorkload.forEach(member => {
            if (y > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
                drawTableHeader();
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
            }
            doc.text(member.name, margin, y);
            doc.text(`${member.count} Tasks`, pageWidth - margin, y, { align: 'right' });
            y += 8;
        });

        return doc;
    }, [overallProgressChartRef, statusBreakdownChartRef, teamWorkloadChartRef, priorityBreakdownChartRef, sortedTeamWorkload]);

    const handleExportPdf = useCallback(() => {
        const doc = generatePdfDoc();
        doc.save('project-report.pdf');
    }, [generatePdfDoc]);

    const handleSendEmail = useCallback((recipient: string) => {
        console.log(`Simulating sending email to: ${recipient}`);
        try {
            const doc = generatePdfDoc();
            const pdfData = doc.output('datauristring');
            console.log('PDF generated for email attachment.', pdfData.substring(0, 100) + '...');
            alert(`Report successfully sent to ${recipient}! (This is a simulation, check the console for details)`);
        } catch (error) {
            console.error("Failed to generate PDF for email:", error);
            alert("There was an error generating the PDF for the email. Please try again.");
        } finally {
            setIsEmailModalOpen(false);
        }
    }, [generatePdfDoc]);

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-2xl font-bold text-brand-text">No Task Data Available</h2>
                <p className="text-gray-500 mt-2">Upload a project document or create tasks on the dashboard to view the report.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-brand-primary">Project Report Dashboard</h2>
                    <p className="text-gray-600 mt-1">A visual overview of your project's current status.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="px-5 py-2.5 bg-white text-brand-text font-bold rounded-md hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 border border-gray-300"
                    >
                        <EmailIcon className="h-5 w-5" />
                        Email Report
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="px-5 py-2.5 bg-brand-primary text-white font-bold rounded-md hover:opacity-90 transition-opacity duration-200 flex items-center gap-2"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Overall Progress">
                    <canvas ref={overallProgressChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Task Status Breakdown">
                    <canvas ref={statusBreakdownChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Team Workload">
                    <canvas ref={teamWorkloadChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Tasks by Priority">
                    <canvas ref={priorityBreakdownChartRef}></canvas>
                </ChartCard>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-glass border border-white/30 p-6 mt-6">
                <h3 className="text-xl font-bold text-brand-text mb-4">Team Workload Details</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200/80">
                                <th className="p-3 text-sm font-semibold text-gray-500">Assignee</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 text-right">Tasks Assigned</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeamWorkload.map((member) => (
                                <tr key={member.name} className="border-b border-gray-200/50 last:border-b-0 hover:bg-gray-100/50 transition-colors">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} alt={member.name} className="h-8 w-8 rounded-full" />
                                            <span className="font-medium text-brand-text">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-semibold text-brand-text">{member.count} Tasks</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <EmailReportModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSend={handleSendEmail}
            />
        </div>
    );
};

export default ReportView;