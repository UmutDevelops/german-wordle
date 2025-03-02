"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGame } from "@/lib/GameContext";
import GameLayout from "@/components/layout/GameLayout";
import WordGrid from "@/components/game/WordGrid";
import ScoreBoard from "@/components/game/ScoreBoard";
import PlayerList from "@/components/game/PlayerList";
import Timer from "@/components/game/Timer";
import Button from "@/components/ui/Button";
import { Play, ArrowRight, Award, Timer as TimerIcon, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const { 
    player, 
    room, 
    guesses, 
    currentGuess, 
    leaderboard,
    isConnected,
    error,
    timeRemaining,
    roundComplete,
    showLeaderboard,
    currentRoundWord,
    correctGuessers,
    waitingForNextRound,
    makeGuess,
    updateCurrentGuess,
    startGame,
    nextRound,
    endGame,
    forceEndRound,
    joinRoom,
    logout,
    setShowLeaderboard
  } = useGame();
  
  // Eğer giriş yapılmamışsa ana sayfaya yönlendir
  useEffect(() => {
    if (!player) {
      router.push("/");
      return;
    }
    
    // Eğer oda yoksa ve roomCode parametresi varsa odaya katıl
    if (!room && roomCode) {
      joinRoom(roomCode as string);
    }
  }, [player, room, roomCode, router, joinRoom]);

  // Doğru tahmin veya süre bitimi sonrası 5 saniye sonra otomatik olarak sonraki tura geç (admin için)
  useEffect(() => {
    if (player?.isAdmin && showLeaderboard && room?.status === 'playing') {
      const timer = setTimeout(() => {
        nextRound();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [player?.isAdmin, showLeaderboard, room?.status, nextRound]);

  // Kelime uzunluğunu belirle
  const getWordLength = () => {
    if (room?.currentWord?.word) {
      // Gerçek kelime uzunluğunu kullan
      return room.currentWord.word.length;
    }
    // Varsayılan 5 harf
    return 5;
  };
  
  // Oyuncunun doğru tahmin yapıp yapmadığını kontrol et
  const hasGuessedCorrectly = () => {
    return player && correctGuessers.includes(player.id);
  };
  
  // Fiziksel klavye için olay dinleyicisi ekle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (room?.status !== 'playing' || roundComplete || waitingForNextRound) {
        return;
      }
      
      const wordLength = getWordLength();
      
      if (e.key === 'Enter') {
        if (currentGuess.length === wordLength) {
          makeGuess(currentGuess);
        }
      } else if (e.key === 'Backspace') {
        if (currentGuess.length > 0) {
          updateCurrentGuess(currentGuess.slice(0, -1));
        }
      } else if (/^[a-zA-ZäöüÄÖÜß]$/.test(e.key)) {
        if (currentGuess.length < wordLength) {
          updateCurrentGuess(currentGuess + e.key.toUpperCase());
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentGuess, room, roundComplete, waitingForNextRound, makeGuess, updateCurrentGuess, getWordLength]);
  
  // Geri gitme fonksiyonu
  const handleBack = () => {
    router.push("/room");
  };
  
  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    logout();
    router.push("/");
  };
  
  // Turu zorla sonlandır (admin)
  const handleForceEndRound = () => {
    if (player?.isAdmin) {
      forceEndRound();
    }
  };
  
  // Eğer yükleniyor veya oyuncu/oda yoksa loading göster
  if (!player || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // Eğer oyun bekleme modundaysa
  if (room.status === 'waiting') {
    return (
      <GameLayout 
        title="Oyun Bekleniyor" 
        showBack={true} 
        onBack={handleBack}
        roomCode={room.code}
      >
        <div className="flex flex-col items-center justify-center mt-8 space-y-8">
          <div className="text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold mb-2">Oyun Başlatılmayı Bekliyor</h2>
              <p className="text-muted-foreground mt-2">
                Oyunun başlaması için bir adminin oyunu başlatması gerekiyor.
              </p>
            </motion.div>
          </div>
          
          <PlayerList 
            players={room.players} 
            creatorId={room.creatorId} 
          />
          
          {player.isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button 
                onClick={startGame}
                icon={<Play size={16} />}
                fullWidth
                size="lg"
              >
                Oyunu Başlat
              </Button>
            </motion.div>
          )}
        </div>
      </GameLayout>
    );
  }
  
  // Eğer oyun bitmiş veya liderlik tablosu gösteriliyorsa
  if (room.status === 'finished' || showLeaderboard) {
    return (
      <GameLayout 
        title={room.status === 'finished' ? "Oyun Bitti" : `${room.currentRound}. Tur Sonuçları`}
        showBack={true} 
        onBack={handleBack}
        roomCode={room.code}
      >
        <ScoreBoard 
          leaderboard={leaderboard}
          currentRound={room.currentRound}
          totalRounds={room.totalRounds}
          isAdmin={player.isAdmin}
          onNextRound={nextRound}
          onEndGame={endGame}
          autoTransition={room.status !== 'finished' && player.isAdmin}
          correctWord={currentRoundWord}
        />
      </GameLayout>
    );
  }
  
  // Oyun devam ediyorsa
  return (
    <GameLayout 
      title={`${room.currentRound}. Tur`} 
      showBack={player.isAdmin} 
      onBack={handleBack}
      roomCode={room.code}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Süre bilgisi */}
        <Timer 
          seconds={timeRemaining} 
          size="lg" 
          className="w-full shadow-md rounded-xl"
          warnAt={30}
        />
        
        {/* Oyun durumu bilgisi */}
        <div className="w-full bg-primary/5 p-3 rounded-xl shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TimerIcon size={16} className="text-primary" />
              <span className="text-sm font-medium">Tur {room.currentRound}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
                {getWordLength()} Harfli
              </span>
              
              <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
                Almanca
              </span>
            </div>
          </div>
        </div>
        
        {/* Doğru tahmini yapanlar */}
        {correctGuessers.length > 0 && (
          <div className="w-full bg-green-50 dark:bg-green-900/20 p-3 rounded-xl shadow-sm">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">
                  {correctGuessers.length} oyuncu doğru tahmin yaptı
                </span>
              </div>
            </motion.div>
          </div>
        )}
      
        {/* Kelime grid */}
        <WordGrid 
          guesses={guesses}
          currentGuess={currentGuess}
          wordLength={getWordLength()}
          maxAttempts={6}
          isWaitingForNextRound={waitingForNextRound}
          correctWord={currentRoundWord}
        />
        
        {/* İpucu gösterimi - Her zaman görünür */}
        {room.currentWord && room.currentWord.hint && (
          <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 text-foreground p-4 rounded-xl shadow-sm text-center mb-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 justify-center mb-1">
                <Info size={16} className="text-yellow-600 dark:text-yellow-400" />
                <p className="font-medium">İpucu</p>
              </div>
              <p>{room.currentWord.hint}</p>
            </motion.div>
          </div>
        )}
        
        {/* Güncel tahmin gösterimi */}
        {!waitingForNextRound ? (
          <>
            <div className="w-full bg-card shadow-sm p-4 rounded-xl mb-2">
              <p className="text-center font-medium">
                Tahmin: <span className="font-bold">{currentGuess}</span>
                <span className="inline-block ml-1 animate-blink">|</span>
              </p>
            </div>
            
            {/* Tahmin gönderme butonu */}
            <div className="w-full flex justify-center">
              <Button
                onClick={() => makeGuess(currentGuess)}
                disabled={currentGuess.length !== getWordLength() || waitingForNextRound}
                icon={<ArrowRight size={16} />}
                fullWidth
                size="lg"
                className="shadow-md"
              >
                Tahmin Et
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full bg-primary/5 p-4 rounded-xl shadow-sm animate-pulse mt-2">
            <p className="text-center text-muted-foreground">
              {hasGuessedCorrectly() ? (
                "Doğru tahmin yaptınız! Diğer oyuncuları bekliyorsunuz..."
              ) : (
                "Sonraki tura geçilmesini bekliyorsunuz..."
              )}
            </p>
          </div>
        )}
        
        {/* Bilgilendirme */}
        <p className="text-sm text-muted-foreground text-center mt-2">
          Tahmininizi klavyenizden yazabilirsiniz.<br />
          Tamamladığınızda Enter tuşuna basın.
        </p>
      </div>
      
      {/* Admin için turu sonlandırma butonu */}
      {player.isAdmin && !roundComplete && (
        <div className="fixed bottom-20 right-4">
          <Button
            onClick={handleForceEndRound}
            variant="outline"
            icon={<Award size={16} />}
          >
            Turu Bitir
          </Button>
        </div>
      )}
    </GameLayout>
  );
}