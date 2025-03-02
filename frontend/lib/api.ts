"use client";

import axios from 'axios';

// API URL - Monorepo yapısında relative URL kullanıyoruz
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// API istemcisi oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (studentId: string) => {
    try {
      const response = await api.post('/auth/login', { studentId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  checkIsAdmin: async (studentId: string) => {
    try {
      const response = await api.get(`/auth/admin/${studentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Room API
export const roomAPI = {
  createRoom: async (studentId: string) => {
    try {
      const response = await api.post('/rooms/create', { studentId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getRoomInfo: async (roomCode: string) => {
    try {
      const response = await api.get(`/rooms/${roomCode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getLeaderboard: async (roomCode: string) => {
    try {
      const response = await api.get(`/rooms/${roomCode}/leaderboard`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;