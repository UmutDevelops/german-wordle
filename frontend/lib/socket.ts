"use client";

import { io, Socket } from 'socket.io-client';

// Socket URL - Monorepo yapısında relative URL kullanıyoruz
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

// Socket türleri
type RoomSocket = Socket;

// Singleton socket instance
let socket: RoomSocket | null = null;

// Socket bağlantısı oluştur
export const initializeSocket = (): RoomSocket => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/rooms`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io',
      transports: ['polling', 'websocket']  // Vercel için optimize edilmiş
    });
    
    // Bağlantı olaylarını dinle
    socket.on('connect', () => {
      console.log('Socket bağlantısı kuruldu');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket bağlantısı kesildi');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket bağlantı hatası:', error);
    });
  }
  
  return socket;
};

// Socket bağlantısını kapat
export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket bağlantısını getir
export const getSocket = (): RoomSocket => {
  if (!socket) {
    return initializeSocket();
  }
  
  return socket;
};

export default {
  initializeSocket,
  getSocket,
  closeSocket,
};