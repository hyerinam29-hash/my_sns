import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

/**
 * 메인 애플리케이션 레이아웃
 * 
 * 반응형 레이아웃:
 * - Desktop (1024px+): Sidebar (244px) + Main Feed (최대 630px)
 * - Tablet (768px ~ 1023px): Icon Sidebar (72px) + Main Feed
 * - Mobile (< 768px): Header (60px) + Main Feed + BottomNav (50px)
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--instagram-background)] flex">
      {/* Sidebar 컴포넌트 (Desktop & Tablet 전용) */}
      <Sidebar />

      {/* Header 컴포넌트 (Mobile 전용) */}
      <Header />

      {/* Main Feed 영역 */}
      <main className="flex-1 md:ml-[72px] lg:ml-[244px] pt-[60px] md:pt-0 pb-[50px] md:pb-0">
        <div className="mx-auto max-w-[630px] px-4 py-4">
          {children}
        </div>
      </main>

      {/* BottomNav 컴포넌트 (Mobile 전용) */}
      <BottomNav />
    </div>
  );
}

