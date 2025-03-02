"use client";

import React, { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  className,
  error,
  label,
  fullWidth = false,
  leftIcon,
  rightIcon,
  helperText,
  ...props
}) => {
  return (
    <div className={cn('space-y-1.5', fullWidth ? 'w-full' : '')}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors',
            'focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none',
            'placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            fullWidth ? 'w-full' : '',
            error ? 'border-destructive focus:border-destructive focus:ring-destructive' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">
              {error}
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;