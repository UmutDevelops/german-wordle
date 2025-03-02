"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Guess } from '@/lib/GameContext';
import { motion } from 'framer-motion';

interface WordGridProps {
  guesses: Guess[];
  currentGuess: string;
  wordLength: number;
  maxAttempts: number;
  isWaitingForNextRound?: boolean;
  correctWord?: string | null;
}

const WordGrid: React.FC<WordGridProps> = ({
  guesses = [], 
  currentGuess = '',
  wordLength = 5,
  maxAttempts = 6,
  isWaitingForNextRound = false,
  correctWord = null
}) => {
  // Aktif satırı hesapla
  const activeRow = guesses.length;
  
  // Boş satırlar için dizi oluştur
  const rows = [...Array(maxAttempts)].map((_, i) => {
    if (i < guesses.length && guesses[i] && guesses[i].text) {
      // Eski tahminler (tamamlanmış tahminler)
      return guesses[i].text.split('').map((char, j) => ({
        char,
        state: guesses[i].result && guesses[i].result[j] ? guesses[i].result[j] : 'empty'
      }));
    } else if (i === activeRow) {
      // Aktif tahmin (şu anda yazılan)
      const currentGuessArray = currentGuess.split('');
      return [...Array(wordLength)].map((_, j) => ({
        char: currentGuessArray[j] || '',
        state: 'empty'
      }));
    } else {
      // Boş satırlar (henüz tahmin yapılmamış)
      return [...Array(wordLength)].map(() => ({
        char: '',
        state: 'empty'
      }));
    }
  });
  
  // Renk sınıfları
  const stateClasses = {
    correct: 'bg-green-500 text-white border-green-500 dark:bg-green-600 dark:border-green-600',
    misplaced: 'bg-yellow-500 text-white border-yellow-500 dark:bg-yellow-600 dark:border-yellow-600',
    wrong: 'bg-gray-500 text-white border-gray-500 dark:bg-gray-600 dark:border-gray-600',
    empty: 'bg-background border-gray-300 dark:border-gray-700'
  };
  
  // Animasyon için delay
  const getAnimationDelay = (col: number) => `${col * 0.15}s`;
  
  // Hücre boyutunu kelime uzunluğuna göre ayarla
  const getCellSize = () => {
    // 5 harflik kelimeler için varsayılan boyut
    if (wordLength <= 5) return 'w-12 h-12 sm:w-14 sm:h-14';
    
    // 6 harflik kelimeler için daha küçük boyut
    if (wordLength === 6) return 'w-10 h-10 sm:w-12 sm:h-12';
    
    // 7 ve üzeri harfler için daha da küçük boyut
    return 'w-8 h-8 sm:w-10 sm:h-10';
  };
  
  // Font boyutunu kelime uzunluğuna göre ayarla
  const getFontSize = () => {
    if (wordLength <= 5) return 'text-xl sm:text-2xl';
    if (wordLength === 6) return 'text-lg sm:text-xl';
    return 'text-base sm:text-lg';
  };
  
  // Doğru kelimeyi göster (tur sonunda)
  const renderCorrectWord = () => {
    if (!correctWord) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-4 p-3 bg-primary/10 rounded-lg text-center"
      >
        <p className="text-sm text-muted-foreground mb-1">Doğru Kelime:</p>
        <p className="font-bold text-xl">{correctWord}</p>
      </motion.div>
    );
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid gap-2 mx-auto">
        {rows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="grid gap-1 sm:gap-2"
            style={{ 
              gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` 
            }}
          >
            {row.map((cell, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: rowIndex * 0.05 + colIndex * 0.05, 
                  duration: 0.2 
                }}
                className={cn(
                  getCellSize(), 
                  'border-2 rounded-md flex items-center justify-center',
                  getFontSize(),
                  'font-bold uppercase transition-all duration-300',
                  cell.char && rowIndex === activeRow 
                    ? 'animate-pulse' : '',
                  cell.state !== 'empty' && rowIndex < activeRow 
                    ? 'animate-flip-in' : '',
                  isWaitingForNextRound ? 'opacity-70' : '',
                  stateClasses[cell.state as keyof typeof stateClasses]
                )}
                style={{ 
                  animationDelay: getAnimationDelay(colIndex),
                  transitionDelay: getAnimationDelay(colIndex)
                }}
              >
                {cell.char}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      
      {isWaitingForNextRound && renderCorrectWord()}
      
      {isWaitingForNextRound && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-2 p-2 bg-primary/5 rounded-lg text-center"
        >
          <p className="text-sm text-muted-foreground">
            Sonraki turu bekliyorsunuz...
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default WordGrid;