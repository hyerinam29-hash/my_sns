"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User } from "lucide-react";
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import CreatePostModal from "@/components/post/CreatePostModal";

/**
 * Sidebar 컴포넌트
 * 
 * Instagram 스타일의 사이드바
 * - Desktop (1024px+): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px ~ 1023px): 72px 너비, 아이콘만
 * - Mobile (< 768px): 숨김 (Header + BottomNav 사용)
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const menuItems = [
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
      icon: User,
      label: "프로필",
      href: user ? `/profile/${user.id}` : "/profile",
      onClick: undefined,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen bg-[var(--instagram-card-background)] border-r border-[var(--instagram-border)] hidden md:flex flex-col">
      {/* Desktop (1024px+): 244px 너비, 아이콘 + 텍스트 */}
      <div className="hidden lg:flex w-[244px] flex-col pt-4 px-4 h-full">
        {/* 로고 영역 */}
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Instagram
          </h1>
        </div>

        {/* 상단 네비게이션 */}
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isActiveProfile =
              item.href.startsWith("/profile") &&
              pathname.startsWith("/profile");

            const active = isActive || isActiveProfile;

            if (item.onClick) {
              return (
                <button
                  key={item.href}
                  onClick={item.onClick}
                  className={`
                    flex items-center gap-4 px-4 py-3 rounded-lg w-full
                    transition-colors duration-200
                    font-instagram-normal text-[var(--text-primary)] hover:bg-[var(--instagram-background)]
                  `}
                >
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-instagram-base">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    active
                      ? "font-instagram-bold text-[var(--text-primary)]"
                      : "font-instagram-normal text-[var(--text-primary)] hover:bg-[var(--instagram-background)]"
                  }
                `}
              >
                <Icon
                  className={`w-6 h-6 ${
                    active ? "stroke-[2.5]" : "stroke-[1.5]"
                  }`}
                />
                <span className="text-instagram-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 하단 영역: 로그인/사용자 버튼을 항상 하단에 고정 */}
        <div className="mt-auto pb-4">
          {/* 로그인 버튼 (SignedOut일 때만) */}
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className={`
                  flex items-center justify-center px-4 py-3 rounded-lg w-full mt-2
                  transition-colors duration-200
                  font-instagram-semibold text-white
                  bg-[var(--instagram-blue)] hover:bg-[#0084d6]
                `}
              >
                <span className="text-instagram-base">로그인</span>
              </button>
            </SignInButton>
          </SignedOut>

          {/* 사용자 버튼 (SignedIn일 때) */}
          <SignedIn>
            <div className="mt-2 px-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border border-[var(--instagram-border)]",
                    userButtonPopoverActionButton: "hover:bg-[var(--instagram-background)]",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>

      {/* Tablet (768px ~ 1023px): 72px 너비, 아이콘만 */}
      <div className="flex lg:hidden w-[72px] flex-col pt-4 px-2 h-full">
        {/* 로고 영역 (아이콘만) */}
        <div className="mb-8 flex justify-center">
          <div className="w-8 h-8 bg-[var(--instagram-blue)] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">IG</span>
          </div>
        </div>

        {/* 상단 네비게이션 (아이콘만) */}
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isActiveProfile =
              item.href.startsWith("/profile") &&
              pathname.startsWith("/profile");

            const active = isActive || isActiveProfile;

            if (item.onClick) {
              return (
                <button
                  key={item.href}
                  onClick={item.onClick}
                  className="flex items-center justify-center p-3 rounded-lg hover:bg-[var(--instagram-background)] transition-colors duration-200"
                  title={item.label}
                >
                  <Icon className="w-6 h-6 stroke-[1.5] text-[var(--text-primary)]" />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center justify-center p-3 rounded-lg
                  transition-colors duration-200
                  ${
                    active
                      ? "bg-[var(--instagram-background)]"
                      : "hover:bg-[var(--instagram-background)]"
                  }
                `}
                title={item.label}
              >
                <Icon
                  className={`w-6 h-6 ${
                    active
                      ? "stroke-[2.5] text-[var(--text-primary)]"
                      : "stroke-[1.5] text-[var(--text-primary)]"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* 하단 영역: 로그인/사용자 버튼을 항상 하단에 고정 (Tablet) */}
        <div className="mt-auto pb-4">
          {/* 로그인 버튼 (SignedOut일 때만, Tablet) */}
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="flex items-center justify-center p-3 rounded-lg hover:bg-[var(--instagram-background)] transition-colors duration-200"
                title="로그인"
              >
                <User className="w-6 h-6 stroke-[1.5] text-[var(--instagram-blue)]" />
              </button>
            </SignInButton>
          </SignedOut>

          {/* 사용자 버튼 (SignedIn일 때, Tablet) */}
          <SignedIn>
            <div className="flex items-center justify-center p-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border border-[var(--instagram-border)]",
                    userButtonPopoverActionButton: "hover:bg-[var(--instagram-background)]",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </aside>
  );
}

