"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSocket } from './socket';

// Oyuncu tipi
export type Player = {
  id: string;
  name: string;
  isAdmin: boolean;
  connected?: boolean;
  guesses?: any[];
  lastGuessTime?: number | null;
  hasGuessedCorrectly?: boolean;
};

// Tahmin sonucu tipi
export type GuessResult = 'correct' | 'misplaced' | 'wrong';

// Tahmin tipi
export type Guess = {
  text: string;
  result: GuessResult[];
  time: number;
  isCorrect: boolean;
};

// Kelime tipi
export type Word = {
  word: string;
  hint: string;
};

// Liderlik tablosu tipi
export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  hasGuessedCorrectly?: boolean;
};

// Oda tipi
export type Room = {
  code: string;
  creatorId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentWord: Word | null;
  scores: Record<string, number>;
  startTime: number | null;
  roundStartTime: number | null;
  roundEndTime?: number | null;
  correctGuessers?: string[];
};

// Oyun durumu tipi
type GameState = {
  room: Room | null;
  player: Player | null;
  currentGuess: string;
  guesses: Guess[];
  leaderboard: LeaderboardEntry[];
  isConnected: boolean;
  error: string | null;
  showLeaderboard: boolean;
  timeRemaining: number | null;
  roundComplete: boolean;
  currentRoundWord: string | null;
  correctGuessers: string[];
  waitingForNextRound: boolean;
};

// Oyun aksiyonları
type GameActions = {
  login: (studentId: string) => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  startGame: () => Promise<void>;
  makeGuess: (guess: string) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  forceEndRound: () => Promise<void>;
  updateCurrentGuess: (value: string) => void;
  resetError: () => void;
  logout: () => void;
  setShowLeaderboard: (show: boolean) => void;
};

// Context tipi
type GameContextType = GameState & GameActions;

// Başlangıç durumu
const initialState: GameState = {
  room: null,
  player: null,
  currentGuess: '',
  guesses: [],
  leaderboard: [],
  isConnected: false,
  error: null,
  showLeaderboard: false,
  timeRemaining: null,
  roundComplete: false,
  currentRoundWord: null,
  correctGuessers: [],
  waitingForNextRound: false,
};

// Context oluştur
const GameContext = createContext<GameContextType | undefined>(undefined);

// Context Provider bileşeni
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(initialState);
  
  // Round süresi (2 dakika)
  const ROUND_DURATION = 120; // saniye cinsinden
  
  // Timer için useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    // Aktif bir round varsa ve süre kaldıysa timer'ı başlat
    if (state.room?.status === 'playing' && !state.roundComplete) {
      const currentTime = Date.now();
      const roundStartTime = state.room.roundStartTime || currentTime;
      const roundEndTime = state.room.roundEndTime || (roundStartTime + ROUND_DURATION * 1000);
      const remaining = Math.max(0, Math.floor((roundEndTime - currentTime) / 1000));
      
      if (remaining > 0) {
        timer = setInterval(() => {
          const now = Date.now();
          const newRemaining = Math.max(0, Math.floor((roundEndTime - now) / 1000));
          
          setState(prev => ({
            ...prev,
            timeRemaining: newRemaining
          }));
          
          // Süre bittiyse
          if (newRemaining <= 0) {
            if (timer) clearInterval(timer);
            
            // Tur sonlandı, skor tablosunu göster
            setState(prev => ({
              ...prev,
              timeRemaining: 0,
              roundComplete: true,
              waitingForNextRound: true
            }));
          }
        }, 1000);
      } else {
        // Süre zaten bitmişse
        setState(prev => ({
          ...prev,
          timeRemaining: 0,
          roundComplete: true,
          waitingForNextRound: true
        }));
      }
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.room?.status, state.room?.roundStartTime, state.room?.roundEndTime, state.roundComplete]);
  
  // Socket bağlantısını kurma
  useEffect(() => {
    const socket = getSocket();
    
    // Socket olaylarını dinle
    const setupSocketListeners = () => {
      socket.on('connect', () => {
        setState(prev => ({ ...prev, isConnected: true }));
        console.log('Socket bağlantısı kuruldu');
      });
      
      socket.on('disconnect', () => {
        setState(prev => ({ ...prev, isConnected: false }));
        console.log('Socket bağlantısı kesildi');
      });
      
      socket.on('error', (data: { message: string }) => {
        console.error('Socket hatası:', data.message);
        setState(prev => ({ ...prev, error: data.message }));
      });
      
      socket.on('room-joined', (room: Room) => {
        console.log('Odaya katıldı:', room);
        setState(prev => ({ ...prev, room }));
      });
      
      socket.on('player-joined', (data: { player: Player }) => {
        console.log('Oyuncu katıldı:', data.player);
        setState(prev => {
          if (!prev.room) return prev;
          
          return {
            ...prev,
            room: {
              ...prev.room,
              players: [...prev.room.players, data.player]
            }
          };
        });

        // Özel event triggerlama
        document.dispatchEvent(new CustomEvent('player-joined', { detail: data }));
      });
      
      socket.on('player-left', (data: { playerId: string, playerName: string }) => {
        console.log('Oyuncu ayrıldı:', data);
        setState(prev => {
          if (!prev.room) return prev;
          
          return {
            ...prev,
            room: {
              ...prev.room,
              players: prev.room.players.map(player => 
                player.id === data.playerId 
                  ? { ...player, connected: false } 
                  : player
              )
            }
          };
        });

        // Özel event triggerlama
        document.dispatchEvent(new CustomEvent('player-left', { detail: data }));
      });
      
      socket.on('game-started', (data: { gameInfo: any }) => {
        console.log('Oyun başladı:', data);
        const currentTime = Date.now();
        const roundEndTime = currentTime + ROUND_DURATION * 1000;
        
        setState(prev => {
          if (!prev.room) return prev;
          
          return {
            ...prev,
            room: {
              ...prev.room,
              status: 'playing',
              currentRound: data.gameInfo.currentRound,
              currentWord: {
                word: '?'.repeat(data.gameInfo.wordLength),
                hint: data.gameInfo.hint || '' // İpucu bilgisini al
              },
              roundStartTime: currentTime,
              roundEndTime: roundEndTime
            },
            guesses: [], // Oyun başladığında tahminleri temizle
            timeRemaining: ROUND_DURATION,
            roundComplete: false,
            showLeaderboard: false,
            currentRoundWord: null,
            correctGuessers: [],
            waitingForNextRound: false,
          };
        });
      });
      
      socket.on('room-left', (data: { success: boolean }) => {
        console.log('Odadan çıkıldı:', data);
        if (data.success) {
          setState(prev => ({
            ...prev,
            room: null,
            guesses: [],
            timeRemaining: null,
            roundComplete: false,
            showLeaderboard: false,
            correctGuessers: [],
            waitingForNextRound: false,
          }));
        }
      });
      
      socket.on('guess-result', (data: any) => {
        console.log('Tahmin sonucu:', data);
        
        const newGuess: Guess = {
          text: data.guess,
          result: data.result,
          time: Date.now(),
          isCorrect: data.isCorrect
        };
        
        setState(prev => {
          const newState = {
            ...prev,
            guesses: [...prev.guesses, newGuess],
            currentGuess: '' // Tahmini temizle
          };
          
          // Eğer doğru tahmin, oyuncunun durumunu güncelle
          if (data.isCorrect && prev.player) {
            return {
              ...newState,
              waitingForNextRound: true,
            };
          }
          
          return newState;
        });
      });
      
      socket.on('correct-guess', (data: { playerId: string, playerName: string, points: number }) => {
        console.log('Doğru tahmin:', data);
        
        setState(prev => {
          // Doğru tahmin yapan oyuncuyu listeye ekle
          const newCorrectGuessers = [...prev.correctGuessers, data.playerId];
          
          // Doğru tahmin yapıldığında bildirim göster
          document.dispatchEvent(new CustomEvent('correct-guess', { 
            detail: { playerName: data.playerName, points: data.points } 
          }));
          
          return {
            ...prev,
            correctGuessers: newCorrectGuessers,
          };
        });
      });
      
      socket.on('reveal-word', (data: { word: string }) => {
        console.log('Kelime gösterildi:', data);
        setState(prev => ({ 
          ...prev, 
          currentRoundWord: data.word 
        }));
      });
      
      socket.on('round-complete', () => {
        console.log('Tur tamamlandı');
        setState(prev => ({ 
          ...prev, 
          roundComplete: true,
          showLeaderboard: true,
          waitingForNextRound: true,
        }));
      });
      
      socket.on('leaderboard-update', (leaderboard: LeaderboardEntry[]) => {
        console.log('Liderlik tablosu güncellendi:', leaderboard);
        setState(prev => ({ ...prev, leaderboard }));
      });
      
      socket.on('round-started', (data: { roundInfo: any }) => {
        console.log('Tur başladı:', data);
        const currentTime = Date.now();
        const roundEndTime = currentTime + ROUND_DURATION * 1000;
        
        setState(prev => {
          if (!prev.room) return prev;
          
          return {
            ...prev,
            room: {
              ...prev.room,
              currentRound: data.roundInfo.currentRound,
              currentWord: {
                word: '?'.repeat(data.roundInfo.wordLength),
                hint: data.roundInfo.hint || '' // İpucu bilgisini al
              },
              roundStartTime: currentTime,
              roundEndTime: roundEndTime
            },
            guesses: [], // Tahminleri temizle
            currentGuess: '', // Aktif tahmini temizle
            timeRemaining: ROUND_DURATION,
            roundComplete: false,
            showLeaderboard: false,
            currentRoundWord: null,
            correctGuessers: [],
            waitingForNextRound: false,
          };
        });
      });
      
      socket.on('game-finished', (data: { leaderboard: LeaderboardEntry[] }) => {
        console.log('Oyun bitti:', data);
        setState(prev => {
          if (!prev.room) return prev;
          
          return {
            ...prev,
            room: {
              ...prev.room,
              status: 'finished'
            },
            leaderboard: data.leaderboard,
            timeRemaining: null,
            roundComplete: true,
            showLeaderboard: true,
            waitingForNextRound: false,
          };
        });
      });
    };
    
    setupSocketListeners();
    
    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('room-joined');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('room-left');
      socket.off('game-started');
      socket.off('guess-result');
      socket.off('correct-guess');
      socket.off('reveal-word');
      socket.off('round-complete');
      socket.off('leaderboard-update');
      socket.off('round-started');
      socket.off('game-finished');
    };
  }, [state.player]);
  
  // Aksiyonlar
  
  // Giriş yapma
  const login = async (studentId: string): Promise<void> => {
    try {
      // API'dan öğrenci bilgilerini al
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setState(prev => ({ ...prev, error: data.message }));
        return;
      }
      
      // Öğrenci bilgilerini kaydet
      setState(prev => ({ ...prev, player: data.student }));
      
      // Local storage'a kaydet
      localStorage.setItem('player', JSON.stringify(data.student));
      
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Giriş yapılırken bir hata oluştu' }));
    }
  };
  
  // Odaya katılma
  const joinRoom = async (roomCode: string): Promise<void> => {
    if (!state.player) {
      setState(prev => ({ ...prev, error: 'Önce giriş yapmalısınız' }));
      return;
    }
    
    const socket = getSocket();
    
    // Odaya katıl
    socket.emit('join-room', {
      roomCode,
      player: state.player
    });
  };
  
  // Oyunu başlatma
  const startGame = async (): Promise<void> => {
    if (!state.player || !state.room) {
      setState(prev => ({ ...prev, error: 'Önce odaya katılmalısınız' }));
      return;
    }
    
    if (!state.player.isAdmin) {
      setState(prev => ({ ...prev, error: 'Sadece adminler oyunu başlatabilir' }));
      return;
    }
    
    const socket = getSocket();
    
    // Oyunu başlat
    socket.emit('start-game', {
      roomCode: state.room.code,
      studentId: state.player.id
    });
  };
  
  // Tahmin yapma
  const makeGuess = async (guess: string): Promise<void> => {
    if (!state.player || !state.room) {
      setState(prev => ({ ...prev, error: 'Önce odaya katılmalısınız' }));
      return;
    }
    
    if (state.room.status !== 'playing') {
      setState(prev => ({ ...prev, error: 'Oyun aktif değil' }));
      return;
    }
    
    if (state.roundComplete) {
      setState(prev => ({ ...prev, error: 'Bu tur tamamlandı' }));
      return;
    }
    
    // Eğer oyuncu zaten doğru tahmin yaptıysa
    if (state.correctGuessers.includes(state.player.id)) {
      setState(prev => ({ ...prev, error: 'Bu turda zaten doğru tahmin yaptınız' }));
      return;
    }
    
    // Eğer oyuncu sonraki turu bekliyorsa
    if (state.waitingForNextRound) {
      setState(prev => ({ ...prev, error: 'Sonraki turu bekliyorsunuz' }));
      return;
    }
    
    const currentWordLength = state.room.currentWord?.word.length || 5;
    
    if (guess.length !== currentWordLength) {
      setState(prev => ({ ...prev, error: `Tahmin ${currentWordLength} harfli olmalıdır` }));
      return;
    }
    
    const socket = getSocket();
    
    console.log('Tahmin yapılıyor:', guess);
    
    // Tahmin yap
    socket.emit('make-guess', {
      roomCode: state.room.code,
      playerId: state.player.id,
      guess
    });
  };
  
  // Sonraki tura geç
  const nextRound = async (): Promise<void> => {
    if (!state.player || !state.room) {
      setState(prev => ({ ...prev, error: 'Önce odaya katılmalısınız' }));
      return;
    }
    
    if (!state.player.isAdmin) {
      setState(prev => ({ ...prev, error: 'Sadece adminler sonraki tura geçebilir' }));
      return;
    }
    
    const socket = getSocket();
    
    // Sonraki tura geç
    socket.emit('next-round', {
      roomCode: state.room.code,
      studentId: state.player.id
    });
  };
  
  // Oyunu bitir
  const endGame = async (): Promise<void> => {
    if (!state.player || !state.room) {
      setState(prev => ({ ...prev, error: 'Önce odaya katılmalısınız' }));
      return;
    }
    
    if (!state.player.isAdmin) {
      setState(prev => ({ ...prev, error: 'Sadece adminler oyunu bitirebilir' }));
      return;
    }
    
    const socket = getSocket();
    
    // Oyunu bitir
    socket.emit('end-game', {
      roomCode: state.room.code,
      studentId: state.player.id
    });
  };
  
  // Turu zorla bitir (admin)
  const forceEndRound = async (): Promise<void> => {
    if (!state.player || !state.room) {
      setState(prev => ({ ...prev, error: 'Önce odaya katılmalısınız' }));
      return;
    }
    
    if (!state.player.isAdmin) {
      setState(prev => ({ ...prev, error: 'Sadece adminler turu sonlandırabilir' }));
      return;
    }
    
    const socket = getSocket();
    
    // Turu zorla bitir
    socket.emit('force-end-round', {
      roomCode: state.room.code,
      studentId: state.player.id
    });
  };
  
  // Çıkış yap
  const logout = (): void => {
    // Eğer bir odadaysak odadan çıkış yap
    if (state.player && state.room) {
      const socket = getSocket();
      socket.emit('leave-room', {
        roomCode: state.room.code,
        playerId: state.player.id
      });
    }
    
    // Yerel depodan oyuncu bilgilerini temizle
    localStorage.removeItem('player');
    
    // State'i temizle
    setState(initialState);
  };
  
  // Güncel tahmini güncelle
  const updateCurrentGuess = (value: string): void => {
    if (state.room?.currentWord) {
      const wordLength = state.room.currentWord.word.length || 5;
      
      // Kelime uzunluğunu aşan kısmı kes
      if (value.length > wordLength) {
        value = value.slice(0, wordLength);
      }
    }
    
    setState(prev => ({ ...prev, currentGuess: value.toUpperCase() }));
  };
  
  // Hatayı sıfırla
  const resetError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };
  
  // Skor tablosunu göster/gizle
  const setShowLeaderboard = (show: boolean): void => {
    setState(prev => ({ ...prev, showLeaderboard: show }));
  };
  
  // Local storage'dan oyuncu bilgilerini yükleme
  useEffect(() => {
    // Local storage'dan oyuncu bilgilerini al
    const storedPlayer = localStorage.getItem('player');
    
    if (storedPlayer) {
      try {
        const parsedPlayer = JSON.parse(storedPlayer);
        setState(prev => ({ 
          ...prev, 
          player: parsedPlayer
        }));
      } catch (error) {
        console.error('Local storage parsing error:', error);
      }
    }
  }, []);
  
  return (
    <GameContext.Provider
      value={{
        ...state,
        login,
        joinRoom,
        startGame,
        makeGuess,
        nextRound,
        endGame,
        forceEndRound,
        updateCurrentGuess,
        resetError,
        logout,
        setShowLeaderboard
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Hook for using the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  
  return context;
};

export default GameContext;