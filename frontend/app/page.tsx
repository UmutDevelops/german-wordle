"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/GameContext";
import LoginForm from "@/components/auth/LoginForm";
import MobileLayout from "@/components/layout/MobileLayout";

export default function Home() {
  const { player } = useGame();
  const router = useRouter();
  
  // Eğer giriş yapılmışsa oda sayfasına yönlendir
  useEffect(() => {
    if (player) {
      router.push("/room");
    }
  }, [player, router]);
  
  return (
    <MobileLayout>
      <div className="flex min-h-screen items-center justify-center p-4">
        <LoginForm />
      </div>
    </MobileLayout>
  );
}