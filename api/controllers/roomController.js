const { 
    createRoom, 
    getRoomInfo, 
    getLeaderboard 
  } = require('../models/rooms');
  const { isStudentAdmin } = require('../models/students');
  
  // Yeni oda oluştur (sadece adminler)
  const createGameRoom = (req, res) => {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Öğrenci numarası gerekli' 
      });
    }
    
    // Admin kontrolü
    if (!isStudentAdmin(studentId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Sadece adminler oda oluşturabilir' 
      });
    }
    
    const room = createRoom(studentId);
    
    return res.status(201).json({
      success: true,
      room: {
        code: room.code,
        creatorId: room.creatorId
      }
    });
  };
  
  // Oda bilgisini getir
  const getRoomDetails = (req, res) => {
    const { roomCode } = req.params;
    
    if (!roomCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Oda kodu gerekli' 
      });
    }
    
    const result = getRoomInfo(roomCode);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    return res.status(200).json(result);
  };
  
  // Liderlik tablosunu getir
  const getRoomLeaderboard = (req, res) => {
    const { roomCode } = req.params;
    
    if (!roomCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Oda kodu gerekli' 
      });
    }
    
    const result = getLeaderboard(roomCode);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    return res.status(200).json(result);
  };
  
  module.exports = {
    createGameRoom,
    getRoomDetails,
    getRoomLeaderboard
  };