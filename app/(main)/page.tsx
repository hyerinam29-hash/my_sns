/**
 * 홈 피드 페이지
 * 
 * PostFeed 컴포넌트를 사용하여 게시물 목록을 표시합니다.
 * - 게시물 목록 표시
 * - 무한 스크롤
 * - 페이지네이션 (10개씩 로드)
 * - 게시물 작성 모달 관리
 */
"use client";

import { useState } from "react";
import PostFeed from "@/components/post/PostFeed";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    // 피드 새로고침을 위해 key 변경 (강제 리렌더링)
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="mx-auto max-w-[630px] px-4 py-4">
      <PostFeed key={refreshKey} onPostCreated={handlePostCreated} />
    </div>
  );
}

