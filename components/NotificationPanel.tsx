import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Notification } from '../types';
import { BellIcon } from './icons';

interface NotificationPanelProps {
  notifications: Notification[];
  onNotificationClick: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

function formatTimeAgo(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `just now`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onNotificationClick, onMarkAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationItemClick = (notificationId: string) => {
    onNotificationClick(notificationId);
    setIsOpen(false); // Close panel after clicking an item
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white/50 text-brand-text/70 hover:text-brand-text hover:bg-white/80 transition-colors"
        aria-label="Toggle notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl z-20 border border-white/30 animate-fadeIn overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-200/80">
            <h3 className="font-semibold text-brand-text">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={onMarkAllAsRead} className="text-sm text-brand-accent hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    onClick={() => handleNotificationItemClick(notification.id)}
                    className={`border-b border-gray-200/50 last:border-b-0 cursor-pointer transition-colors ${
                      notification.isRead ? 'bg-transparent' : 'bg-brand-accent/10 hover:bg-brand-accent/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 p-3">
                       {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 shrink-0"></div>
                        )}
                      <div className={`flex-1 ${notification.isRead ? 'pl-5': ''}`}>
                        <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-brand-text'}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-1 ${notification.isRead ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;