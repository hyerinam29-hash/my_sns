"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from "lucide-react";

/**
 * PostCard 컴포넌트
 * 
 * Instagram 스타일의 게시물 카드
 * 
 * @param post - 게시물 데이터
 * @param user - 게시물 작성자 정보
 */
interface CommentPreview {
  id: string;
  user: {
    name: string;
    clerk_id?: string; // 프로필 링크용 (선택적)
  };
  content: string;
}

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
  likesCount?: number; // 좋아요 수 (기본값: 0)
  commentsCount?: number; // 댓글 총 개수 (기본값: 0)
  previewComments?: CommentPreview[]; // 댓글 미리보기 (최신 2개)
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

export default function PostCard({ 
  post, 
  user, 
  likesCount = 0, 
  commentsCount = 0, 
  previewComments = [] 
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const lastTapRef = useRef<number>(0);

  // 더블탭 좋아요 이벤트 (모바일)
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms 이내 더블탭 감지

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      if (!isLiked) {
        setIsLiked(true);
        setShowDoubleTapHeart(true);
        setTimeout(() => {
          setShowDoubleTapHeart(false);
        }, 1000);
      }
    }

    lastTapRef.current = now;
  };

  // 좋아요 버튼 클릭
  const handleLikeClick = () => {
    setIsLiked((prev) => !prev);
  };

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

      {/* Image 영역 (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-[var(--instagram-background)]">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          onDoubleClick={handleDoubleTap}
        />

        {/* 더블탭 좋아요 애니메이션 (큰 하트) */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div
              className="animate-[fadeInOut_1s_ease-in-out]"
              style={{
                animation: "fadeInOut 1s ease-in-out",
              }}
            >
              <Heart
                className="w-24 h-24 text-[var(--like-red)] fill-[var(--like-red)]"
                strokeWidth={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions 영역 (48px) */}
      <div className="h-[48px] flex items-center justify-between px-4">
        {/* 좌측: 좋아요, 댓글, 공유 */}
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            onClick={handleLikeClick}
            className="p-1 hover:opacity-70 transition-all duration-150 active:scale-[1.3]"
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
          >
            <Heart
              className={`w-6 h-6 transition-all duration-150 ${
                isLiked
                  ? "fill-[var(--like-red)] text-[var(--like-red)] stroke-[var(--like-red)]"
                  : "text-[var(--text-primary)]"
              }`}
              strokeWidth={isLiked ? 2.5 : 1.5}
            />
          </button>

          {/* 댓글 버튼 */}
          <button
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6 text-[var(--text-primary)]" />
          </button>

          {/* 공유 버튼 (UI만) */}
          <button
            className="p-1 hover:opacity-70 transition-opacity opacity-50 cursor-not-allowed"
            aria-label="공유"
            disabled
          >
            <Send className="w-6 h-6 text-[var(--text-primary)]" />
          </button>
        </div>

        {/* 우측: 북마크 (UI만) */}
        <button
          className="p-1 hover:opacity-70 transition-opacity opacity-50 cursor-not-allowed"
          aria-label="북마크"
          disabled
        >
          <Bookmark className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* Content 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 (Bold) */}
        {likesCount > 0 && (
          <div className="font-instagram-bold text-[var(--text-primary)] text-instagram-sm">
            좋아요 {likesCount.toLocaleString()}개
          </div>
        )}

        {/* 캡션 (사용자명 Bold + 내용) */}
        {post.caption && (
          <div className="text-instagram-sm text-[var(--text-primary)]">
            <Link
              href={`/profile/${user.clerk_id}`}
              className="font-instagram-bold hover:opacity-70 transition-opacity"
            >
              {user.name}
            </Link>
            <span className="ml-2">
              {showFullCaption ? (
                post.caption
              ) : (
                <>
                  <span className={post.caption.length > 100 ? "line-clamp-2" : ""}>
                    {post.caption}
                  </span>
                  {post.caption.length > 100 && (
                    <button
                      onClick={() => setShowFullCaption(true)}
                      className="text-[var(--text-secondary)] hover:opacity-70 transition-opacity ml-1"
                    >
                      ... 더 보기
                    </button>
                  )}
                </>
              )}
            </span>
            {showFullCaption && post.caption.length > 100 && (
              <button
                onClick={() => setShowFullCaption(false)}
                className="text-[var(--text-secondary)] hover:opacity-70 transition-opacity ml-1"
              >
                ... 간략히
              </button>
            )}
          </div>
        )}

        {/* 댓글 총 개수 표시 ("댓글 X개 모두 보기") */}
        {commentsCount > 2 && (
          <button
            className="text-[var(--text-secondary)] text-instagram-sm hover:opacity-70 transition-opacity"
            onClick={() => {
              // TODO: 게시물 상세 모달/페이지 열기 (7단계에서 구현)
              console.log("게시물 상세 페이지 열기:", post.id);
            }}
          >
            댓글 {commentsCount}개 모두 보기
          </button>
        )}

        {/* 댓글 미리보기 (최신 2개) */}
        {previewComments.length > 0 && (
          <div className="space-y-1">
            {previewComments.map((comment) => (
              <div
                key={comment.id}
                className="text-instagram-sm text-[var(--text-primary)]"
              >
                <Link
                  href={`/profile/${comment.user.clerk_id || comment.user.name}`}
                  className="font-instagram-bold hover:opacity-70 transition-opacity"
                >
                  {comment.user.name}
                </Link>
                <span className="ml-2">{comment.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

