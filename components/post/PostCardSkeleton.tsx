/**
 * PostCardSkeleton 컴포넌트
 * 
 * 게시물 로딩 중 표시되는 Skeleton UI
 * 
 * PostCard와 동일한 구조를 가지며, 회색 박스와 Shimmer 효과로 로딩 상태를 표현합니다.
 * 
 * React.memo로 최적화: props가 없으므로 항상 동일한 결과를 반환하므로 메모이제이션합니다.
 */

import { memo } from "react";

const PostCardSkeleton = function PostCardSkeleton() {
  return (
    <article className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm mb-4">
      {/* Header (60px) */}
      <header className="h-[60px] flex items-center justify-between px-4">
        {/* 좌측: 프로필 이미지 + 사용자명 */}
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 Skeleton (32px 원형) */}
          <div className="w-8 h-8 rounded-full bg-[var(--instagram-border)] shimmer" />
          
          {/* 사용자명 + 시간 Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-[var(--instagram-border)] rounded shimmer" />
            <div className="h-3 w-16 bg-[var(--instagram-border)] rounded shimmer" />
          </div>
        </div>

        {/* 우측: 메뉴 버튼 Skeleton */}
        <div className="w-5 h-5 bg-[var(--instagram-border)] rounded shimmer" />
      </header>

      {/* Image 영역 Skeleton (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-[var(--instagram-border)] shimmer" />

      {/* Actions 영역 (48px) */}
      <div className="h-[48px] flex items-center justify-between px-4">
        {/* 좌측: 좋아요, 댓글, 공유 버튼 Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-[var(--instagram-border)] rounded shimmer" />
          <div className="w-6 h-6 bg-[var(--instagram-border)] rounded shimmer" />
          <div className="w-6 h-6 bg-[var(--instagram-border)] rounded shimmer" />
        </div>

        {/* 우측: 북마크 버튼 Skeleton */}
        <div className="w-6 h-6 bg-[var(--instagram-border)] rounded shimmer" />
      </div>

      {/* Content 영역 Skeleton */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 Skeleton */}
        <div className="h-4 w-20 bg-[var(--instagram-border)] rounded shimmer" />

        {/* 캡션 Skeleton */}
        <div className="space-y-1">
          <div className="h-4 w-32 bg-[var(--instagram-border)] rounded shimmer" />
          <div className="h-4 w-full bg-[var(--instagram-border)] rounded shimmer" />
          <div className="h-4 w-3/4 bg-[var(--instagram-border)] rounded shimmer" />
        </div>

        {/* 댓글 미리보기 Skeleton */}
        <div className="space-y-2 pt-2">
          <div className="h-3 w-24 bg-[var(--instagram-border)] rounded shimmer" />
          <div className="space-y-1">
            <div className="h-3 w-full bg-[var(--instagram-border)] rounded shimmer" />
            <div className="h-3 w-5/6 bg-[var(--instagram-border)] rounded shimmer" />
          </div>
        </div>
      </div>
    </article>
  );
};

export default memo(PostCardSkeleton);

