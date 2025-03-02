const { getRandomWord } = require('./words');

// In-memory oda veritabanı
const rooms = new Map();

// Rastgele oda kodu oluştur
const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Yeni oda oluştur
const createRoom = (creatorId) => {
  const roomCode = generateRoomCode();
  
  const newRoom = {
    code: roomCode,
    creatorId,
    status: 'waiting', // waiting, playing, finished
    players: [],
    currentRound: 0,
    totalRounds: Infinity, // Sınırsız tur
    currentWord: null,
    scores: {},
    startTime: null,
    roundStartTime: null,
    roundEndTime: null,
    correctGuessers: [] // Doğru tahmin yapan oyuncuları takip et
  };
  
  rooms.set(roomCode, newRoom);
  return newRoom;
};

// Odaya oyuncu ekle
const addPlayerToRoom = (roomCode, player) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  
  // Eğer oyuncu zaten odadaysa güncelle
  const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
  if (existingPlayerIndex !== -1) {
    room.players[existingPlayerIndex] = {
      ...room.players[existingPlayerIndex],
      ...player,
      connected: true
    };
  } else {
    // Oyuncuyu odaya ekle
    room.players.push({
      ...player,
      connected: true,
      guesses: [],
      lastGuessTime: null,
      hasGuessedCorrectly: false // Doğru tahmin yapıp yapmadığını izle
    });
    
    // Başlangıç puanını ayarla
    room.scores[player.id] = 0;
  }
  
  return { success: true, room };
};

// Odadan oyuncu çıkar
const removePlayerFromRoom = (roomCode, playerId) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  
  if (playerIndex !== -1) {
    // Oyuncuyu bağlantısını kapat olarak işaretle
    room.players[playerIndex].connected = false;
  }
  
  return { success: true, room };
};

// Odayı başlat
const startRoom = (roomCode) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  
  // İlk kelimeyi ayarla
  room.currentWord = getRandomWord();
  room.status = 'playing';
  room.currentRound = 1;
  room.startTime = Date.now();
  room.roundStartTime = Date.now();
  room.roundEndTime = Date.now() + 120000; // 2 dakika (120 saniye)
  room.correctGuessers = []; // Doğru tahmin yapanları sıfırla
  
  // Oyuncuların tahmin geçmişini temizle
  room.players.forEach(player => {
    player.guesses = [];
    player.lastGuessTime = null;
    player.hasGuessedCorrectly = false;
  });
  
  // Oyunu başlatırken ipucu bilgisini de oyun başlangıcında gönder
  return { 
    success: true, 
    room,
    gameInfo: {
      currentRound: room.currentRound,
      wordLength: room.currentWord.word.length,
      hint: room.currentWord.hint // İpucu bilgisini gönder
    } 
  };
};

// Odayı sonlandır
const endRoom = (roomCode) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  room.status = 'finished';
  
  return { success: true, room };
};

// Tur sonu kontrolü - tüm oyuncular tahmin yaptı mı veya süre doldu mu
const shouldEndRound = (room) => {
  // Süre dolmuşsa turu bitir
  if (room.roundEndTime && Date.now() > room.roundEndTime) {
    return true;
  }
  
  // Aktif oyuncuları say
  const activePlayers = room.players.filter(p => p.connected);
  
  // Doğru tahmin yapan sayısı, toplam aktif oyuncu sayısına eşitse turu bitir
  if (room.correctGuessers.length > 0 && room.correctGuessers.length === activePlayers.length) {
    return true;
  }
  
  return false;
};

// Sonraki tura geç
const nextRound = (roomCode) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  
  // Sonraki tura geç
  room.currentRound += 1;
  room.currentWord = getRandomWord();
  room.roundStartTime = Date.now();
  room.roundEndTime = Date.now() + 120000; // 2 dakika (120 saniye)
  room.correctGuessers = []; // Doğru tahmin yapanları sıfırla
  
  // Oyuncuların tahmin geçmişini temizle
  room.players.forEach(player => {
    player.guesses = [];
    player.lastGuessTime = null;
    player.hasGuessedCorrectly = false;
  });
  
  // Yeni turun bilgilerini ve ipucu bilgisini gönder
  return { 
    success: true, 
    room, 
    isFinished: false,
    roundInfo: {
      currentRound: room.currentRound,
      wordLength: room.currentWord.word.length,
      hint: room.currentWord.hint // İpucu bilgisini gönder
    }
  };
};

// Kelime tahmini yap
const makeGuess = (roomCode, playerId, guess) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  const player = room.players.find(p => p.id === playerId);
  
  if (!player) {
    return { success: false, message: 'Oyuncu bulunamadı' };
  }
  
  if (room.status !== 'playing') {
    return { success: false, message: 'Oyun aktif değil' };
  }
  
  // Eğer oyuncu zaten doğru tahmin yaptıysa yeniden tahmin yapmasına izin verme
  if (player.hasGuessedCorrectly) {
    return { success: false, message: 'Bu turda zaten doğru tahmin yaptınız' };
  }
  
  // Tur süresi dolmuşsa tahmin yapılamaz
  if (room.roundEndTime && Date.now() > room.roundEndTime) {
    return { success: false, message: 'Tur süresi doldu' };
  }
  
  // Tahmini büyük harflere çevir
  guess = guess.toUpperCase();
  
  // Kelime uzunluğunu kontrol et
  const currentWord = room.currentWord.word;
  if (guess.length !== currentWord.length) {
    return { success: false, message: `Tahmin ${currentWord.length} harfli olmalıdır` };
  }
  
  // Tahmin sonucunu değerlendir
  const result = evaluateGuess(currentWord, guess);
  const isCorrect = guess === currentWord;
  
  // Tahmini kaydet
  const guessData = {
    text: guess,
    result,
    time: Date.now(),
    isCorrect
  };
  
  player.guesses.push(guessData);
  player.lastGuessTime = Date.now();
  
  // Doğru tahmin ise puan ekle ve doğru tahmin yapanlar listesine ekle
  if (isCorrect) {
    // Oyuncuyu doğru tahmin yapanlar listesine ekle
    room.correctGuessers.push(playerId);
    
    // Oyuncunun doğru tahmin yaptığını işaretle
    player.hasGuessedCorrectly = true;
    
    const timeTaken = (Date.now() - room.roundStartTime) / 1000; // Saniye cinsinden
    const guessCount = player.guesses.length;
    
    // Puanlama: 
    // Baz puan: 100
    // Hız bonusu: Maksimum 50 puan (30 saniyeden önce tamamlarsa)
    // Tahmin sayısı bonusu: Maksimum 50 puan (3 veya daha az tahminle)
    
    let points = 100; // Baz puan
    
    // Hız bonusu (30 saniyeden önce)
    if (timeTaken < 30) {
      points += Math.round(50 * (1 - timeTaken / 30));
    }
    
    // Tahmin sayısı bonusu (3 veya daha az tahmin)
    if (guessCount <= 3) {
      points += Math.round(50 * (1 - (guessCount - 1) / 3));
    }
    
    // Minimum 10 puan garanti
    points = Math.max(10, points);
    
    // Puanı kaydet
    room.scores[playerId] += points;
    
    // Tüm aktif oyuncular doğru tahmin yaptıysa veya süre dolduysa
    const shouldEnd = shouldEndRound(room);
    
    return { 
      success: true, 
      room, 
      result, 
      isCorrect, 
      points,
      shouldEndRound: shouldEnd
    };
  }
  
  return { 
    success: true, 
    room, 
    result, 
    isCorrect 
  };
};

// Oda bilgisini getir
const getRoomInfo = (roomCode) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  
  // Hassas bilgileri (kelime gibi) filtrele
  const safeRoom = { ...room };
  
  // Oyun devam ediyorsa kelimeyi gizle, ipucunu göster
  if (room.status === 'playing') {
    safeRoom.currentWord = {
      word: '?'.repeat(room.currentWord.word.length), // Kelimeyi gizle
      hint: room.currentWord.hint // İpucunu göster
    };
  }
  
  return { success: true, room: safeRoom };
};

// Tahmin değerlendirme fonksiyonu
const evaluateGuess = (word, guess) => {
  // Kelime uzunluğuna göre sonuç dizisi oluştur
  const result = Array(word.length).fill('wrong'); // wrong, misplaced, correct
  const charCount = {};
  
  // Karakter sayısını hesapla
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    charCount[char] = (charCount[char] || 0) + 1;
  }
  
  // İlk olarak doğru konumları işaretle
  for (let i = 0; i < word.length; i++) {
    if (i < guess.length && guess[i] === word[i]) {
      result[i] = 'correct';
      charCount[word[i]]--; // Kullanılan karakteri say
    }
  }
  
  // Yanlış konumda olanları işaretle
  for (let i = 0; i < guess.length && i < word.length; i++) {
    if (guess[i] !== word[i]) {
      if (charCount[guess[i]] > 0) {
        result[i] = 'misplaced';
        charCount[guess[i]]--;
      }
    }
  }
  
  return result;
};

// Skor tablosunu getir
const getLeaderboard = (roomCode) => {
  if (!rooms.has(roomCode)) {
    return { success: false, message: 'Oda bulunamadı' };
  }
  
  const room = rooms.get(roomCode);
  
  // Skor tablosunu hesapla
  const leaderboard = room.players
    .filter(player => player.connected) // Sadece bağlı oyuncuları göster
    .map(player => ({
      id: player.id,
      name: player.name,
      score: room.scores[player.id] || 0,
      hasGuessedCorrectly: player.hasGuessedCorrectly || false
    }))
    .sort((a, b) => b.score - a.score); // Puanlara göre sırala
  
  return { success: true, leaderboard };
};

module.exports = {
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startRoom,
  endRoom,
  nextRound,
  makeGuess,
  getRoomInfo,
  getLeaderboard,
  shouldEndRound,
  rooms
};