"use client";

import Link from "next/link";
import { Bell, MessageCircle, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";

/**
 * Header 컴포넌트 (Mobile 전용)
 * 
 * Instagram 스타일의 모바일 헤더
 * - 높이: 60px
 * - 로고 + 알림/DM/프로필 아이콘
 * - Mobile (< 768px)에서만 표시
 */
export default function Header() {
  const { user } = useUser();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)] flex items-center justify-between px-4 z-50">
      {/* 로고 */}
      <Link href="/" className="flex items-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Instagram
        </h1>
      </Link>

      {/* 우측 아이콘 그룹 */}
      <div className="flex items-center gap-4">
        {/* 알림 아이콘 */}
        <button
          className="p-2 hover:opacity-70 transition-opacity"
          aria-label="알림"
        >
          <Bell className="w-6 h-6 text-[var(--text-primary)]" />
        </button>

        {/* DM 아이콘 */}
        <button
          className="p-2 hover:opacity-70 transition-opacity"
          aria-label="메시지"
        >
          <MessageCircle className="w-6 h-6 text-[var(--text-primary)]" />
        </button>

        {/* 프로필 아이콘 */}
        <Link
          href={user ? `/profile/${user.id}` : "/profile"}
          className="p-2 hover:opacity-70 transition-opacity"
          aria-label="프로필"
        >
          <User className="w-6 h-6 text-[var(--text-primary)]" />
        </Link>
      </div>
    </header>
  );
}

