"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

/**
 * PostCard 컴포넌트
 * 
 * Instagram 스타일의 게시물 카드
 * 
 * @param post - 게시물 데이터
 * @param user - 게시물 작성자 정보
 */
interface PostCardProps {
  post: {
    id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
  };
  user: {
    id: string;
    clerk_id: string;
    name: string;
    // TODO: 프로필 이미지 URL 추가 예정
  };
}

/**
 * 시간을 상대 시간으로 변환 (예: "3시간 전", "2일 전")
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}개월 전`;
}

export default function PostCard({ post, user }: PostCardProps) {
  return (
    <article className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm mb-4">
      {/* Header (60px) */}
      <header className="h-[60px] flex items-center justify-between px-4">
        {/* 좌측: 프로필 이미지 + 사용자명 */}
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 (32px 원형) */}
          <Link href={`/profile/${user.clerk_id}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--instagram-border)] bg-[var(--instagram-background)] flex items-center justify-center">
              {/* TODO: 실제 프로필 이미지 URL 사용 */}
              <span className="text-[var(--text-secondary)] text-xs font-instagram-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </Link>

          {/* 사용자명 + 시간 */}
          <div className="flex flex-col">
            <Link
              href={`/profile/${user.clerk_id}`}
              className="font-instagram-bold text-[var(--text-primary)] text-instagram-sm hover:opacity-70 transition-opacity"
            >
              {user.name}
            </Link>
            <span className="text-[var(--text-secondary)] text-instagram-xs">
              {formatTimeAgo(post.created_at)}
            </span>
          </div>
        </div>

        {/* 우측: ⋯ 메뉴 버튼 */}
        <button
          className="p-2 hover:opacity-70 transition-opacity"
          aria-label="더보기 메뉴"
        >
          <MoreHorizontal className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </header>

      {/* TODO: Image 영역 - 다음 단계에서 구현 */}
      {/* TODO: Actions 영역 - 다음 단계에서 구현 */}
      {/* TODO: Content 영역 - 다음 단계에서 구현 */}
    </article>
  );
}

