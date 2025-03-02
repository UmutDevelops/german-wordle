"use client";

import React, { useState } from 'react';
import { KeyRound, Plus, Users, LogOut } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useGame } from '@/lib/GameContext';
import { roomAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface RoomFormProps {
  onCreateSuccess?: (roomCode: string) => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ onCreateSuccess }) => {
  const { player, joinRoom, error, resetError } = useGame();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    
    if (!roomCode || roomCode.length < 4) {
      return;
    }
    
    setIsJoining(true);
    
    try {
      await joinRoom(roomCode.toUpperCase());
    } catch (error) {
      console.error('Room join error:', error);
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleCreateRoom = async () => {
    if (!player?.id || !player.isAdmin) {
      return;
    }
    
    resetError();
    setIsCreating(true);
    
    try {
      const result = await roomAPI.createRoom(player.id);
      
      if (result.success && result.room) {
        setRoomCode(result.room.code);
        
        if (onCreateSuccess) {
          onCreateSuccess(result.room.code);
        }
        
        // Otomatik olarak odaya katıl
        await joinRoom(result.room.code);
      }
    } catch (error) {
      console.error('Room creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Çıkış işlemi
  const handleLogout = () => {
    // Yerel depodan oyuncu bilgilerini temizle
    localStorage.removeItem('player');
    
    // Ana sayfaya yönlendir
    router.push('/');
    
    // Sayfayı yenile (temiz başlangıç için)
    window.location.reload();
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Oyun Odası</h1>
        <p className="text-muted-foreground mt-2">Bir oda kodunu girin veya yeni oda oluşturun</p>
      </div>
      
      <form onSubmit={handleJoinRoom} className="space-y-4">
        <Input
          type="text"
          placeholder="Oda kodu (örn: ABC123)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          label="Oda Kodu"
          fullWidth
          required
          pattern="[A-Z0-9]{4,}"
          minLength={4}
          error={error || ''}
          leftIcon={<KeyRound size={16} />}
        />
        
        <Button 
          type="submit" 
          fullWidth 
          isLoading={isJoining}
          disabled={isJoining || roomCode.length < 4}
        >
          Odaya Katıl
        </Button>
      </form>
      
      {player?.isAdmin && (
        <div className="mt-6 border-t pt-6">
          <Button 
            variant="outline" 
            fullWidth 
            isLoading={isCreating}
            disabled={isCreating}
            onClick={handleCreateRoom}
            icon={<Plus size={16} />}
          >
            Yeni Oda Oluştur
          </Button>
        </div>
      )}
      
      {/* Çıkış butonu */}
      <div className="mt-6 border-t pt-6">
        <Button 
          variant="outline" 
          fullWidth 
          onClick={handleLogout}
          icon={<LogOut size={16} />}
        >
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
};

export default RoomForm;