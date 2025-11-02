import React, { useState } from 'react';
import { User } from '../types';

interface UserSelectorProps {
  selectedUser: User;
  onLogout: () => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ selectedUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
      >
        <img src={selectedUser.avatar} alt={selectedUser.name} className="h-8 w-8 rounded-full" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg z-10 border border-gray-200 animate-fadeIn">
          <div className="p-4 border-b border-gray-200">
            <p className="font-semibold text-brand-text">{selectedUser.name}</p>
            <p className="text-sm text-gray-500 truncate">{selectedUser.email}</p>
          </div>
          <ul className="py-1">
            <li>
                <button
                  onClick={onLogout}
                  className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  <span>Sign Out</span>
                </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSelector;