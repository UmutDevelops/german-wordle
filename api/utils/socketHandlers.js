const {
  addPlayerToRoom,
  removePlayerFromRoom,
  startRoom,
  endRoom,
  nextRound,
  makeGuess,
  getRoomInfo,
  getLeaderboard,
  shouldEndRound
} = require('../models/rooms');
const { isStudentAdmin } = require('../models/students');

// Socket.io işleyicileri
const setupSocketHandlers = (io) => {
  // Oda bazlı socket namespace
  const roomNamespace = io.of('/rooms');
  
  // Oda süresi timer'ları
  const roundTimers = new Map();
  
  // Timer'ı başlat
  const startRoundTimer = (roomCode, duration = 120000) => { // 2 dakika (120 saniye)
    // Önceki timer'ı temizle
    if (roundTimers.has(roomCode)) {
      clearTimeout(roundTimers.get(roomCode));
    }
    
    // Yeni timer oluştur
    const timer = setTimeout(() => {
      // Süre dolduğunda odaya bildirim gönder
      roomNamespace.to(roomCode).emit('round-timeout', {
        message: 'Tur süresi doldu'
      });
      
      // Tur bittiğinde tüm oyunculara mevcut kelimeyi göster
      const roomInfo = getRoomInfo(roomCode);
      if (roomInfo.success) {
        roomNamespace.to(roomCode).emit('reveal-word', {
          word: roomInfo.room.currentWord.word
        });
      }
      
      // Liderlik tablosunu gönder
      const leaderboard = getLeaderboard(roomCode);
      if (leaderboard.success) {
        roomNamespace.to(roomCode).emit('leaderboard-update', leaderboard.leaderboard);
        roomNamespace.to(roomCode).emit('round-complete');
      }
    }, duration);
    
    // Timer'ı kaydet
    roundTimers.set(roomCode, timer);
  };
  
  // Timer'ı temizle
  const clearRoundTimer = (roomCode) => {
    if (roundTimers.has(roomCode)) {
      clearTimeout(roundTimers.get(roomCode));
      roundTimers.delete(roomCode);
    }
  };
  
  // Tur sonunu zorla
  const forceEndRound = (roomCode) => {
    // Mevcut timer'ı temizle
    clearRoundTimer(roomCode);
    
    // Tur bittiğinde tüm oyunculara mevcut kelimeyi göster
    const roomInfo = getRoomInfo(roomCode);
    if (roomInfo.success) {
      roomNamespace.to(roomCode).emit('reveal-word', {
        word: roomInfo.room.currentWord.word
      });
    }
    
    // Liderlik tablosunu gönder
    const leaderboard = getLeaderboard(roomCode);
    if (leaderboard.success) {
      roomNamespace.to(roomCode).emit('leaderboard-update', leaderboard.leaderboard);
      roomNamespace.to(roomCode).emit('round-complete');
    }
  };
  
  roomNamespace.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);
    
    // Odaya katılma
    socket.on('join-room', async (data) => {
      const { roomCode, player } = data;
      
      if (!roomCode || !player || !player.id) {
        socket.emit('error', { message: 'Geçersiz istek. Oda kodu ve oyuncu bilgileri gerekli.' });
        return;
      }
      
      const result = addPlayerToRoom(roomCode, player);
      
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }
      
      // Socket'i odaya bağla
      socket.join(roomCode);
      
      // Oyuncuya oda bilgilerini gönder
      socket.emit('room-joined', getRoomInfo(roomCode).room);
      
      // Diğer oyunculara bildirim gönder
      socket.to(roomCode).emit('player-joined', {
        player: {
          id: player.id,
          name: player.name,
          isAdmin: player.isAdmin
        }
      });
      
      // Odadaki oyuncuları dinle
      socket.on('disconnect', () => {
        const leaveResult = removePlayerFromRoom(roomCode, player.id);
        
        if (leaveResult.success) {
          // Diğer oyunculara bildirim gönder
          roomNamespace.to(roomCode).emit('player-left', {
            playerId: player.id,
            playerName: player.name
          });
        }
      });
    });
    
    // Odadan çıkma (manuel olarak çıkış yapma)
    socket.on('leave-room', (data) => {
      const { roomCode, playerId } = data;
      
      if (!roomCode || !playerId) {
        socket.emit('error', { message: 'Geçersiz istek' });
        return;
      }
      
      const result = removePlayerFromRoom(roomCode, playerId);
      
      if (result.success) {
        // Socket'i odadan çıkar
        socket.leave(roomCode);
        
        // Odadaki diğer oyunculara bildirim gönder
        roomNamespace.to(roomCode).emit('player-left', {
          playerId,
          playerName: result.room.players.find(p => p.id === playerId)?.name || 'Bilinmeyen Oyuncu'
        });
        
        // Oyuncuya başarılı çıkış bilgisi gönder
        socket.emit('room-left', { success: true });
      } else {
        socket.emit('error', { message: result.message });
      }
    });
    
    // Oyunu başlat (sadece admin)
    socket.on('start-game', (data) => {
      const { roomCode, studentId } = data;
      
      if (!isStudentAdmin(studentId)) {
        socket.emit('error', { message: 'Sadece adminler oyunu başlatabilir' });
        return;
      }
      
      const result = startRoom(roomCode);
      
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }
      
      // Süre timerını başlat
      startRoundTimer(roomCode);
      
      // Tüm oyunculara bildirim gönder
      roomNamespace.to(roomCode).emit('game-started', {
        gameInfo: {
          currentRound: result.room.currentRound,
          totalRounds: result.room.totalRounds,
          // Kelime uzunluğunu ve ipucu bilgisini gönder
          wordLength: result.room.currentWord.word.length,
          hint: result.room.currentWord.hint
        }
      });
    });
    
    // Tahmin yap
    socket.on('make-guess', (data) => {
      const { roomCode, playerId, guess } = data;
      
      if (!roomCode || !playerId || !guess) {
        socket.emit('error', { message: 'Geçersiz istek' });
        return;
      }
      
      const result = makeGuess(roomCode, playerId, guess);
      
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }
      
      // Tahmin sonucunu sadece tahmin yapan oyuncuya gönder
      socket.emit('guess-result', {
        guess: guess,
        result: result.result,
        isCorrect: result.isCorrect,
        points: result.points || 0
      });
      
      // Eğer doğru tahmin yapılmışsa, tüm oyunculara bildir
      if (result.isCorrect) {
        // Doğru tahmin yapan kişinin bilgilerini gönder
        roomNamespace.to(roomCode).emit('correct-guess', {
          playerId,
          playerName: result.room.players.find(p => p.id === playerId)?.name || 'Bilinmeyen Oyuncu',
          points: result.points
        });
        
        // Liderlik tablosunu gönder
        const leaderboard = getLeaderboard(roomCode);
        if (leaderboard.success) {
          roomNamespace.to(roomCode).emit('leaderboard-update', leaderboard.leaderboard);
        }// Eğer tur sonu koşulları sağlanıyorsa turu bitir
        if (result.shouldEndRound) {
          // Tur bittiğinde tüm oyunculara mevcut kelimeyi göster
          roomNamespace.to(roomCode).emit('reveal-word', {
            word: result.room.currentWord.word
          });
          
          roomNamespace.to(roomCode).emit('round-complete');
          
          // Timer'ı durdur
          clearRoundTimer(roomCode);
        }
      }
    });
    
    // Sonraki tura geç (sadece admin)
    socket.on('next-round', (data) => {
      const { roomCode, studentId } = data;
      
      if (!isStudentAdmin(studentId)) {
        socket.emit('error', { message: 'Sadece adminler sonraki tura geçebilir' });
        return;
      }
      
      const result = nextRound(roomCode);
      
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }
      
      // Önceki turu durdur ve yeni turu başlat
      clearRoundTimer(roomCode);
      startRoundTimer(roomCode);
      
      if (result.isFinished) {
        // Oyun bittiyse, bitişi bildir
        roomNamespace.to(roomCode).emit('game-finished', {
          leaderboard: getLeaderboard(roomCode).leaderboard
        });
      } else {
        // Sonraki turu bildir
        roomNamespace.to(roomCode).emit('round-started', {
          roundInfo: {
            currentRound: result.room.currentRound,
            totalRounds: result.room.totalRounds,
            wordLength: result.room.currentWord.word.length,
            hint: result.room.currentWord.hint // İpucu bilgisini gönder
          }
        });
      }
    });
    
    // Oyunu bitir (sadece admin)
    socket.on('end-game', (data) => {
      const { roomCode, studentId } = data;
      
      if (!isStudentAdmin(studentId)) {
        socket.emit('error', { message: 'Sadece adminler oyunu bitirebilir' });
        return;
      }
      
      const result = endRoom(roomCode);
      
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }
      
      // Timer'ı durdur
      clearRoundTimer(roomCode);
      
      // Oyun sonu bildirimi gönder
      roomNamespace.to(roomCode).emit('game-finished', {
        leaderboard: getLeaderboard(roomCode).leaderboard
      });
    });
    
    // Tur sonunu zorla (sadece admin)
    socket.on('force-end-round', (data) => {
      const { roomCode, studentId } = data;
      
      if (!isStudentAdmin(studentId)) {
        socket.emit('error', { message: 'Sadece adminler turu sonlandırabilir' });
        return;
      }
      
      // Tur sonunu zorla
      forceEndRound(roomCode);
    });
  });
};

module.exports = setupSocketHandlers;