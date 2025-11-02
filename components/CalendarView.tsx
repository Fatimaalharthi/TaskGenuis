

import React, { useState, useMemo } from 'react';
import { Task, User } from '../types';

interface CalendarViewProps {
  currentUser: User;
  tasks: Task[];
  currentUserRole: 'manager' | 'member';
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, tasks, currentUserRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const userTasks = useMemo(() => {
    return currentUserRole === 'manager' ? tasks : tasks.filter(task => task.assignee === currentUser.name);
  }, [tasks, currentUser, currentUserRole]);

  const tasksByDate = useMemo(() => {
    return userTasks.reduce((acc, task) => {
      const date = task.dueDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [userTasks]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

  const calendarDays = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">&lt;</button>
        <h2 className="text-xl font-bold text-brand-text">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">&gt;</button>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-semibold py-3 bg-gray-50 text-sm text-gray-500 border-r border-b border-gray-200">{day}</div>
        ))}
        {calendarDays.map((date, index) => {
          const dateString = date.toISOString().split('T')[0];
          const tasksForDay = tasksByDate[dateString] || [];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();

          return (
            <div key={index} className={`p-2 h-36 flex flex-col bg-white border-r border-b border-gray-200 transition-colors ${isCurrentMonth ? '' : 'bg-gray-50'}`}>
              <span className={`font-medium self-start text-sm ${isCurrentMonth ? 'text-brand-text' : 'text-gray-400'} ${isToday(date) ? 'bg-primary text-white rounded-full h-7 w-7 flex items-center justify-center' : ''}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 overflow-y-auto space-y-1">
                {tasksForDay.map(task => (
                  <div
                    key={task.id}
                    className="p-1 rounded truncate text-xs font-medium text-white"
                    title={task.title}
                    style={{
                      backgroundColor: task.color || '#5B21B6'
                    }}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;