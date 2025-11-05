"use client";

import { Grid3x3, Video, UserCheck } from "lucide-react";

/**
 * 프로필 탭 컴포넌트
 * 
 * @description
 * 프로필 페이지의 탭 네비게이션 컴포넌트입니다.
 * - 게시물, 릴스, 태그됨 탭
 * - Instagram 스타일 적용
 * - 활성 탭 표시
 * 
 * @dependencies
 * - lucide-react: 아이콘
 * - Tailwind CSS: 스타일링
 */

export type ProfileTabType = "posts" | "reels" | "tagged";

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  postsCount?: number;
  reelsCount?: number;
  taggedCount?: number;
}

export default function ProfileTabs({
  activeTab,
  onTabChange,
  postsCount,
  reelsCount,
  taggedCount,
}: ProfileTabsProps) {
  const tabs: Array<{
    id: ProfileTabType;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: "posts",
      label: "게시물",
      icon: <Grid3x3 className="w-5 h-5" />,
      count: postsCount,
    },
    {
      id: "reels",
      label: "릴스",
      icon: <Video className="w-5 h-5" />,
      count: reelsCount,
    },
    {
      id: "tagged",
      label: "태그됨",
      icon: <UserCheck className="w-5 h-5" />,
      count: taggedCount,
    },
  ];

  return (
    <div className="border-b border-[var(--instagram-border)]">
      <div className="flex justify-center gap-8 md:gap-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 relative
                font-instagram-semibold text-instagram-sm
                transition-colors duration-200
                ${
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              {/* 아이콘과 텍스트 */}
              <span className="flex items-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </span>

              {/* 활성 탭 하단 선 */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

