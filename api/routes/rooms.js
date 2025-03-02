const express = require('express');
const { 
  createGameRoom, 
  getRoomDetails, 
  getRoomLeaderboard 
} = require('../controllers/roomController');

const router = express.Router();

// Yeni oda oluştur
router.post('/create', createGameRoom);

// Oda bilgisini getir
router.get('/:roomCode', getRoomDetails);

// Liderlik tablosunu getir
router.get('/:roomCode/leaderboard', getRoomLeaderboard);

module.exports = router;