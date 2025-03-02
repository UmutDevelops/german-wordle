"use client";

import React, { useMemo } from 'react';
import { Users, Crown, CheckCircle, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player } from '@/lib/GameContext';
import { motion } from 'framer-motion';

interface PlayerListProps {
  players: Player[];
  creatorId: string;
  correctGuessers?: string[];
  showScores?: boolean;
  scores?: Record<string, number>;
}

const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  creatorId, 
  correctGuessers = [],
  showScores = false,
  scores = {}
}) => {
  // Bağlantıları aktif olan oyuncuları filtreleyip sırala (önce adminler)
  const sortedPlayers = useMemo(() => {
    return [...players]
      .filter(player => player.connected)
      .sort((a, b) => {
        // Önce oda kurucusu
        if (a.id === creatorId) return -1;
        if (b.id === creatorId) return 1;
        
        // Sonra diğer adminler
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        
        // Son olarak isme göre
        return a.name.localeCompare(b.name);
      });
  }, [players, creatorId]);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };
  
  return (
    <div className="bg-card rounded-xl shadow-md p-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-primary" />
        <h3 className="font-medium">Oyuncular ({sortedPlayers.length})</h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
        >
          <div className="space-y-2">
            {sortedPlayers.map(player => (
              <motion.div
                key={player.id}
                variants={item}
              >
                <div className={cn(
                  'flex items-center p-3 rounded-lg',
                  'bg-accent/20 hover:bg-accent/30 transition-colors',
                  correctGuessers.includes(player.id) ? 'border-l-4 border-green-500' : ''
                )}>
                  <div className="shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    {player.id === creatorId ? (
                      <Crown size={16} className="text-yellow-500" />
                    ) : player.isAdmin ? (
                      <Shield size={16} className="text-primary" />
                    ) : (
                      <User size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate font-medium">{player.name}</span>
                      
                      {player.isAdmin && player.id !== creatorId && (
                        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded ml-1 shrink-0">
                          Admin
                        </span>
                      )}
                      
                      {showScores && (
                        <span className="ml-auto font-bold">
                          {scores[player.id] || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {correctGuessers.includes(player.id) && (
                    <div className="shrink-0 ml-2">
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {sortedPlayers.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
              >
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henüz oyuncu yok
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerList;