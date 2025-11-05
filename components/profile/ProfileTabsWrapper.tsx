"use client";

import { useState } from "react";
import ProfileTabs, { ProfileTabType } from "./ProfileTabs";
import PostGrid from "./PostGrid";

/**
 * 프로필 탭 래퍼 컴포넌트
 * 
 * @description
 * 프로필 페이지의 탭 상태 관리 및 콘텐츠 표시를 담당하는 컴포넌트입니다.
 * - 탭 상태 관리 (게시물, 릴스, 태그됨)
 * - 선택된 탭에 따른 콘텐츠 표시
 * 
 * @dependencies
 * - @/components/profile/ProfileTabs: 탭 UI 컴포넌트
 * - @/components/profile/PostGrid: 게시물 그리드 컴포넌트
 */

interface ProfileTabsWrapperProps {
  userId: string;
  postsCount?: number;
}

export default function ProfileTabsWrapper({
  userId,
  postsCount,
}: ProfileTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabType>("posts");

  const handleTabChange = (tab: ProfileTabType) => {
    console.log("탭 변경:", tab);
    setActiveTab(tab);
  };

  return (
    <>
      {/* 탭 네비게이션 */}
      <div className="px-0">
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          postsCount={postsCount}
        />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="pt-0">
        {activeTab === "posts" && <PostGrid userId={userId} />}
        {activeTab === "reels" && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--text-secondary)]">
            <p className="text-instagram-base">릴스 기능은 준비 중입니다.</p>
          </div>
        )}
        {activeTab === "tagged" && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--text-secondary)]">
            <p className="text-instagram-base">태그된 게시물 기능은 준비 중입니다.</p>
          </div>
        )}
      </div>
    </>
  );
}

