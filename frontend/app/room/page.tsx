"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/GameContext";
import RoomForm from "@/components/auth/RoomForm";
import MobileLayout from "@/components/layout/MobileLayout";

export default function RoomPage() {
  const { player, room } = useGame();
  const router = useRouter();
  
  // Eğer giriş yapılmamışsa ana sayfaya yönlendir
  useEffect(() => {
    if (!player) {
      router.push("/");
    }
  }, [player, router]);
  
  // Eğer bir odaya katılmışsa oyun sayfasına yönlendir
  useEffect(() => {
    if (room) {
      router.push(`/game/${room.code}`);
    }
  }, [room, router]);
  
  if (!player) {
    return null;
  }
  
  return (
    <MobileLayout>
      <div className="flex min-h-screen items-center justify-center p-4">
        <RoomForm />
      </div>
    </MobileLayout>
  );
}