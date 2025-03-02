"use client";

import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  rounded = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring';
  
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary/50',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-primary/50',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-primary/30',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/50',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500/50',
  };
  
  const sizeStyles = {
    xs: 'h-7 px-2 text-xs rounded',
    sm: 'h-9 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-12 px-6 text-base rounded-lg',
    xl: 'h-14 px-8 text-lg rounded-lg',
  };
  
  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };
  
  const loadingSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };
  
  const iconSpacing = {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2',
    xl: 'gap-3',
  };
  
  const combinedClassName = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'w-full' : '',
    rounded ? 'rounded-full' : '',
    disabled || isLoading ? 'opacity-70 cursor-not-allowed' : '',
    iconPosition === 'left' ? iconSpacing[size] : '',
    className
  );
  
  return (
    <button 
      className={combinedClassName} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', loadingSizes[size], 'mr-2')} />
      ) : iconPosition === 'left' && icon ? (
        <span className={cn(iconSizes[size])}>
          {icon}
        </span>
      ) : null}
      
      {children}
      
      {iconPosition === 'right' && icon && !isLoading && (
        <span className={cn(iconSizes[size], 'ml-2')}>
          {icon}
        </span>
      )}
    </button>
  );
};

export default Button;