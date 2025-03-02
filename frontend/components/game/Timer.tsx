"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerProps {
  seconds: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  warnAt?: number;
}

const Timer: React.FC<TimerProps> = ({
  seconds,
  className,
  size = 'md',
  showIcon = true,
  warnAt = 30
}) => {
  // Süreyi biçimlendir (dakika:saniye)
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Süre az kaldıysa uyarı sınıfları
  const isWarning = seconds !== null && seconds <= warnAt;
  const isCritical = seconds !== null && seconds <= 10;

  // Boyut sınıfları
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-5 text-xl'
  };
  
  // Progress bar yüzdesi hesapla (2 dakika üzerinden)
  const calculateProgress = () => {
    if (seconds === null) return 0;
    // Toplam süre 2 dakika (120 saniye) üzerinden yüzde hesapla
    return Math.min(100, Math.max(0, (seconds / 120) * 100));
  };
  
  const progress = calculateProgress();

  return (
    <div className={cn(
      'relative overflow-hidden font-mono rounded-lg bg-card border border-border shadow-sm',
      sizeClasses[size],
      isWarning ? 'border-yellow-400 dark:border-yellow-600' : '',
      isCritical ? 'border-red-500 dark:border-red-600' : '',
      className
    )}>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Progress bar arka planı */}
        <div 
          className={cn(
            'absolute inset-0 h-full transition-all duration-1000 ease-linear',
            !isWarning ? 'bg-primary/10' : 
            isCritical ? 'bg-red-500/20 dark:bg-red-600/20' : 'bg-yellow-500/20 dark:bg-yellow-600/20'
          )}
          style={{ width: `${progress}%` }}
        />
        
        {/* İçerik */}
        <div className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {showIcon && (
              isCritical ? (
                <AlertTriangle className={cn(
                  'text-red-500 dark:text-red-400',
                  size === 'sm' ? 'w-3.5 h-3.5' : 
                  size === 'md' ? 'w-4 h-4' : 
                  'w-5 h-5',
                  isCritical ? 'animate-pulse' : ''
                )} />
              ) : (
                <Clock className={cn(
                  isWarning ? 'text-yellow-500 dark:text-yellow-400' : 'text-primary',
                  size === 'sm' ? 'w-3.5 h-3.5' : 
                  size === 'md' ? 'w-4 h-4' : 
                  'w-5 h-5',
                  isWarning ? 'animate-pulse' : ''
                )} />
              )
            )}
            <span className={cn(
              'font-semibold',
              !isWarning ? 'text-foreground' : 
              isCritical ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500'
            )}>
              Kalan Süre
            </span>
          </div>
          
          <span className={cn(
            'font-bold ml-2',
            !isWarning ? 'text-foreground' : 
            isCritical ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500',
            isCritical ? 'animate-pulse' : ''
          )}>
            {formatTime(seconds)}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Timer;