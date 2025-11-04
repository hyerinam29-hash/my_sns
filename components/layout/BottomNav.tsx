"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import CreatePostModal from "@/components/post/CreatePostModal";

/**
 * BottomNav 컴포넌트 (Mobile 전용)
 * 
 * Instagram 스타일의 하단 네비게이션
 * - 높이: 50px
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 * - Mobile (< 768px)에서만 표시
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    {
      icon: Home,
      label: "홈",
      href: "/",
      onClick: undefined,
    },
    {
      icon: Search,
      label: "검색",
      href: "/search", // TODO: 검색 페이지 구현 시 업데이트
      onClick: undefined,
    },
    {
      icon: Plus,
      label: "만들기",
      href: "#",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        setIsModalOpen(true);
      },
    },
    {
      icon: Heart,
      label: "좋아요",
      href: "/activity", // TODO: 활동 페이지 구현 시 업데이트
      onClick: undefined,
    },
    {
      icon: User,
      label: "프로필",
      href: user ? `/profile/${user.id}` : "/profile",
      onClick: undefined,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-[var(--instagram-card-background)] border-t border-[var(--instagram-border)] flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const isActiveProfile =
          item.href.startsWith("/profile") && pathname.startsWith("/profile");

        const active = isActive || isActiveProfile;

        if (item.onClick) {
          return (
            <button
              key={item.href}
              onClick={item.onClick}
              className={`
                flex flex-col items-center justify-center flex-1 py-1
                transition-colors duration-200
                text-[var(--text-secondary)]
              `}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6 stroke-[1.5]" />
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center flex-1 py-1
              transition-colors duration-200
              ${active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
            `}
            aria-label={item.label}
          >
            <Icon
              className={`w-6 h-6 ${
                active ? "stroke-[2.5]" : "stroke-[1.5]"
              }`}
            />
          </Link>
        );
      })}
      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </nav>
  );
}

