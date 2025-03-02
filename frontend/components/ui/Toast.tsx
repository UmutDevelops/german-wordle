"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  autoClose?: boolean;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  autoClose = true,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Show animation on mount
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    let closeTimeout: NodeJS.Timeout;
    
    if (autoClose) {
      closeTimeout = setTimeout(() => {
        setIsVisible(false);
        
        // Wait for the exit animation to complete
        setTimeout(() => {
          onClose(id);
        }, 300);
      }, duration);
    }
    
    return () => {
      clearTimeout(showTimeout);
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [id, autoClose, duration, onClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    
    // Wait for the exit animation to complete
    setTimeout(() => {
      onClose(id);
    }, 300);
  };
  
  const typeStyles = {
    info: 'bg-blue-100 dark:bg-blue-800/30 border-blue-600 dark:border-blue-500',
    success: 'bg-green-100 dark:bg-green-800/30 border-green-600 dark:border-green-500',
    warning: 'bg-yellow-100 dark:bg-yellow-800/30 border-yellow-600 dark:border-yellow-500',
    error: 'bg-red-100 dark:bg-red-800/30 border-red-600 dark:border-red-500'
  };
  
  const titleTypeStyles = {
    info: 'text-blue-800 dark:text-blue-200',
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    error: 'text-red-800 dark:text-red-200'
  };
  
  return (
    <div 
      className={cn(
        'w-full max-w-sm rounded-lg p-4 shadow-lg border-l-4',
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        typeStyles[type]
      )}
    >
      <div className="flex items-start">
        <div className="flex-1">
          {title && (
            <h3 className={cn('text-sm font-medium', titleTypeStyles[type])}>
              {title}
            </h3>
          )}
          <div className="mt-1 text-sm text-foreground">
            {message}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 inline-flex text-muted-foreground hover:text-foreground focus:outline-none"
        >
          <span className="sr-only">Kapat</span>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const positionStyles = {
  'top-right': 'top-0 right-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-0 left-0'
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts,
  position = 'top-center'
}) => {
  return (
    <div className={cn(
      'fixed z-50 m-4 flex flex-col items-center space-y-4',
      positionStyles[position]
    )}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default Toast;