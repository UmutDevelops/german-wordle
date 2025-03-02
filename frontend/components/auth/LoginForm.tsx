"use client";

import React, { useState, useEffect } from 'react';
import { LogIn, User, LogOut } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useGame } from '@/lib/GameContext';

const LoginForm: React.FC = () => {
  const { login, error, resetError, player } = useGame();
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Eğer daha önceden giriş yapılmış bir kullanıcı varsa, öğrenci numarasını doldur
  useEffect(() => {
    if (player) {
      setStudentId(player.id);
    }
  }, [player]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    
    if (!studentId || studentId.length < 8) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(studentId);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Çıkış işlemi
  const handleLogout = () => {
    // Yerel depodan oyuncu bilgilerini temizle
    localStorage.removeItem('player');
    
    // Sayfayı yenile (temiz başlangıç için)
    window.location.reload();
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User size={24} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Almanca Wordle</h1>
        <p className="text-muted-foreground mt-2">Öğrenci numaranızla giriş yapın</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder='Bir öğrenci numarası girin...' 
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          label="Öğrenci Numarası"
          fullWidth
          required
          pattern="[0-9]{8,}"
          minLength={8}
          error={error || ''}
          leftIcon={<User size={16} />}
        />
        
        <Button 
          type="submit" 
          fullWidth 
          isLoading={isLoading}
          disabled={isLoading || studentId.length < 8}
          icon={<LogIn size={16} />}
        >
          Giriş Yap
        </Button>
        
        {/* Eğer kullanıcı giriş yapmışsa çıkış butonu göster */}
        {player && (
          <Button 
            type="button" 
            fullWidth 
            variant="outline"
            onClick={handleLogout}
            icon={<LogOut size={16} />}
          >
            Çıkış Yap
          </Button>
        )}
      </form>
    </div>
  );
};

export default LoginForm;