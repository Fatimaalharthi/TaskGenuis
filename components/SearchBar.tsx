import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { SearchIcon } from './icons';

interface SearchBarProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ tasks, onTaskSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length > 1) {
      const lowerCaseQuery = query.toLowerCase();
      const filteredTasks = tasks.filter(
        task =>
          task.title.toLowerCase().includes(lowerCaseQuery) ||
          task.description.toLowerCase().includes(lowerCaseQuery)
      );
      setResults(filteredTasks);
      setIsOpen(filteredTasks.length > 0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, tasks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (task: Task) => {
    onTaskSelect(task);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-primary/70" />
        </span>
        <input
            type="text"
            placeholder="Search tasks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.trim().length > 1 && setIsOpen(true)}
            className="w-full md:w-64 pl-10 pr-4 py-2 bg-primary/10 rounded-full text-primary placeholder:text-primary/60 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 md:left-auto mt-2 w-full md:w-80 bg-white/80 backdrop-blur-md rounded-xl shadow-lg z-30 border border-white/30 max-h-80 overflow-y-auto animate-fadeIn">
          <ul className="py-1">
            {results.length > 0 ? (
              results.map(task => (
                <li key={task.id}>
                  <button
                    onClick={() => handleSelect(task)}
                    className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-accent/20"
                  >
                    <p className="font-semibold truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 truncate">{task.description}</p>
                  </button>
                </li>
              ))
            ) : (
                <li className="px-4 py-2 text-sm text-gray-500">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;