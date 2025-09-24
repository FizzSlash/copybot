'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, ExternalLink, Copy } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm w-full bg-dark-800/90 backdrop-blur-xl rounded-lg shadow-2xl border-l-4 transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'border-emerald-400' 
              : notification.type === 'error'
              ? 'border-red-400'
              : 'border-purple-400'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                )}
                {notification.type === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                {notification.type === 'info' && (
                  <AlertCircle className="h-5 w-5 text-purple-400" />
                )}
              </div>
              
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  {notification.message}
                </p>
                
                {notification.action && (
                  <div className="mt-3">
                    <button
                      onClick={notification.action.onClick}
                      className="inline-flex items-center space-x-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                    >
                      <span>{notification.action.label}</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => onRemove(notification.id)}
                  className="bg-dark-700/50 rounded-md inline-flex text-gray-400 hover:text-white focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newNotification: Notification = {
      id,
      duration: 5000, // 5 seconds default
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message: string, action?: Notification['action']) => {
    return addNotification({ type: 'success', title, message, action });
  };

  const showError = (title: string, message: string) => {
    return addNotification({ type: 'error', title, message, duration: 7000 });
  };

  const showInfo = (title: string, message: string, action?: Notification['action']) => {
    return addNotification({ type: 'info', title, message, action });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    NotificationSystem: (props: Omit<NotificationSystemProps, 'notifications' | 'onRemove'>) => (
      <NotificationSystem 
        {...props}
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    )
  };
}