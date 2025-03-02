"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardEntry } from '@/lib/GameContext';
import Button from '../ui/Button';
import { Award, ChevronRight, Timer, AlertTriangle, Check, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreBoardProps {
  leaderboard: LeaderboardEntry[];
  currentRound: number;
  totalRounds: number;
  isAdmin: boolean;
  onNextRound: () => void;
  onEndGame: () => void;
  autoTransition?: boolean;
  correctWord?: string | null;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  leaderboard,
  currentRound,
  totalRounds,
  isAdmin,
  onNextRound,
  onEndGame,
  autoTransition = false,
  correctWord = null
}) => {
  // Otomatik geçiş için sayaç
  const [countdown, setCountdown] = useState(5);
  
  // Otomatik geçiş sayacı
  useEffect(() => {
    if (autoTransition && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoTransition, countdown]);
  
  // İlk 5 oyuncuyu filtrele
  const topPlayers = leaderboard.slice(0, 5);
  
  // Geri kalan oyuncuları say
  const remainingPlayersCount = Math.max(0, leaderboard.length - 5);
  
  // Son tur mu?
  const isGameOver = currentRound >= totalRounds;
  
  // Doğru tahmin yapan oyuncuları filtrele
  const correctGuessers = leaderboard.filter(player => player.hasGuessedCorrectly);
  
  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-xl shadow-lg overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 bg-primary text-primary-foreground text-center">
          <h2 className="text-xl font-bold">
            {isGameOver ? 'Oyun Sonu' : `${currentRound}. Tur Sonuçları`}
          </h2>
          <p className="text-sm opacity-90">
            {isGameOver ? 'Final Sıralaması' : `Tur ${currentRound}`}
          </p>
          
          {/* Otomatik geçiş sayacı */}
          {autoTransition && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
              <Timer size={16} className="animate-pulse" />
              <span>Sonraki tur {countdown} saniye içinde başlayacak</span>
            </div>
          )}
        </div>
        
        {/* Doğru kelime gösterimi */}
        {correctWord && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen size={16} className="text-green-600 dark:text-green-400" />
              <h3 className="font-medium text-green-800 dark:text-green-200">Doğru Kelime</h3>
            </div>
            <p className="text-center font-bold text-xl">{correctWord}</p>
          </div>
        )}
        
        {/* Doğru tahmin yapan oyuncular */}
        {correctGuessers.length > 0 && (
          <div className="p-3 bg-green-50/50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/20">
            <div className="flex items-center justify-center gap-2">
              <Check size={16} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {correctGuessers.length} oyuncu doğru tahmin yaptı
              </span>
            </div>
          </div>
        )}
        
        <div className="p-4">
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {topPlayers.map((player, index) => (
                <motion.div 
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className={cn(
                    'flex items-center p-3 rounded-lg',
                    index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800/30',
                    player.hasGuessedCorrectly ? 'border-l-4 border-green-500 dark:border-green-600' : ''
                  )}>
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3',
                      index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-amber-700 text-white' : 
                      'bg-primary/20 text-primary'
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{player.name}</p>
                    </div>
                    <div className="font-bold text-lg">
                      {player.score}
                    </div>
                    {player.hasGuessedCorrectly && (
                      <div className="ml-2">
                        <Check size={16} className="text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {remainingPlayersCount > 0 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  ve {remainingPlayersCount} oyuncu daha...
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertTriangle size={32} className="mx-auto mb-2 text-yellow-500" />
              <p className="text-muted-foreground">Henüz puan alan oyuncu yok</p>
            </div>
          )}
          
          {isAdmin && (
            <div className="mt-6 space-y-3">
              {!isGameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <Button 
                    fullWidth 
                    onClick={onNextRound}
                    icon={<ChevronRight size={18} />}
                    size="lg"
                    className="shadow-md"
                  >
                    {autoTransition ? `Sonraki Tur (${countdown})` : 'Sonraki Tura Geç'}
                  </Button>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Button 
                  fullWidth 
                  variant="outline"
                  onClick={onEndGame}
                  icon={<Award size={18} />}
                  size="lg"
                >
                  Oyunu Bitir
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScoreBoard;