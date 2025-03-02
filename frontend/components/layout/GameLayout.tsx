"use client";

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { ChevronLeft, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileLayout from './MobileLayout';
import Button from '../ui/Button';
import { ToastContainer, ToastProps } from '../ui/Toast';
import { useGame } from '@/lib/GameContext';
import { useRouter } from 'next/navigation';

interface GameLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  roomCode?: string;
}

const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  title,
  showBack = false,
  onBack,
  roomCode
}) => {
  const { room, player } = useGame();
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const router = useRouter();
  // Benzersiz ID'ler için counter
  const counterRef = useRef(0);

  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    // Yerel depodan oyuncu bilgilerini temizle
    localStorage.removeItem('player');
    
    // Ana sayfaya yönlendir
    router.push('/');
    
    // Sayfayı yenile (temiz başlangıç için)
    window.location.reload();
  };

  // Yeni oyuncu katıldığında toast göster
  useEffect(() => {
    if (!room) return;

    const handlePlayerJoin = (data: { player: { name: string } }) => {
      // Benzersiz ID oluştur
      const uniqueId = `player-join-${Date.now()}-${counterRef.current++}`;
      
      addToast({
        id: uniqueId,
        title: 'Yeni Oyuncu',
        message: `${data.player.name} odaya katıldı`,
        type: 'info'
      });
    };

    const handlePlayerLeave = (data: { playerName: string }) => {
      // Benzersiz ID oluştur
      const uniqueId = `player-leave-${Date.now()}-${counterRef.current++}`;
      
      addToast({
        id: uniqueId,
        title: 'Oyuncu Ayrıldı',
        message: `${data.playerName} odadan ayrıldı`,
        type: 'warning'
      });
    };

    // Event handler fonksiyonları
    const playerJoinHandler = (e: CustomEvent) => handlePlayerJoin(e.detail);
    const playerLeaveHandler = (e: CustomEvent) => handlePlayerLeave(e.detail);

    // Event listener'ları ekle
    document.addEventListener('player-joined', playerJoinHandler as EventListener);
    document.addEventListener('player-left', playerLeaveHandler as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('player-joined', playerJoinHandler as EventListener);
      document.removeEventListener('player-left', playerLeaveHandler as EventListener);
    };
  }, [room]);

  // Toast ekle
  const addToast = (toast: Omit<ToastProps, 'onClose'>) => {
    const newToast: ToastProps = {
      ...toast,
      onClose: (id) => removeToast(id)
    };

    setToasts(prev => [...prev, newToast]);
  };

  // Toast kaldır
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Header içeriği
  const headerContent = (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            icon={<ChevronLeft size={18} />}
            className="mr-1"
            aria-label="Geri"
          />
        )}
        <h1 className="text-lg font-bold">{title}</h1>
        {roomCode && (
          <span className="bg-primary/10 text-primary px-2 py-1 text-xs rounded ml-2">
            {roomCode}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {room && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Users size={18} />}
            onClick={() => setShowPlayerList(!showPlayerList)}
            aria-label="Oyuncu Listesi"
          />
        )}
        
        {/* Çıkış butonu */}
        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut size={18} />}
          onClick={handleLogout}
          aria-label="Çıkış Yap"
        />
      </div>
    </div>
  );

  // Oyuncu listesi yan paneli
  const sidePanel = (
    <div className={cn(
      'fixed inset-y-0 right-0 w-64 bg-background shadow-lg z-40 transform transition-transform duration-300',
      showPlayerList ? 'translate-x-0' : 'translate-x-full'
    )}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-bold">Oyuncular</h2>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={18} />}
          onClick={() => setShowPlayerList(false)}
          aria-label="Kapat"
        />
      </div>
      
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-64px)]">
        {room?.players
          .filter(p => p.connected)
          .map(player => (
            <div key={player.id} className="py-2 border-b last:border-0">
              <div className="font-medium">{player.name}</div>
              {player.isAdmin && (
                <div className="text-xs text-muted-foreground">Admin</div>
              )}
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <>
      <MobileLayout header={headerContent}>
        <div className="p-4 max-w-md mx-auto">
          {children}
        </div>
      </MobileLayout>
      
      {/* Oyuncu listesi yan panel */}
      {sidePanel}
      
      {/* Arka plan overlay */}
      {showPlayerList && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowPlayerList(false)}
        />
      )}
      
      {/* Toast bildirimleri */}
      <ToastContainer toasts={toasts} position="top-center" />
    </>
  );
};

export default GameLayout;