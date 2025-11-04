"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { MoreHorizontal } from "lucide-react";

/**
 * CommentList 컴포넌트
 * 
 * 댓글 목록을 표시하고 관리합니다.
 * 
 * 주요 기능:
 * 1. 댓글 목록 렌더링
 * 2. 스크롤 가능한 영역
 * 3. 최신순 정렬
 * 4. 삭제 버튼 (본인만 표시)
 * 
 * @param comments - 댓글 목록
 * @param onDelete - 댓글 삭제 핸들러
 */
export interface Comment {
  id: string;
  user: {
    id: string;
    clerk_id: string;
    name: string;
  };
  content: string;
  created_at: string;
}

interface CommentListProps {
  comments: Comment[];
  onDelete?: (commentId: string) => void;
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

export default function CommentList({ comments, onDelete }: CommentListProps) {
  const { userId: clerkUserId } = useAuth();
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  // 최신순 정렬 (created_at 내림차순)
  const sortedComments = [...comments].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDeleteClick = (commentId: string) => {
    if (onDelete) {
      onDelete(commentId);
    }
    setShowDeleteMenu(null);
  };

  if (sortedComments.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[var(--text-secondary)] text-instagram-sm">
          댓글이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[400px] overflow-y-auto">
      {sortedComments.map((comment) => {
        const isOwnComment = comment.user.clerk_id === clerkUserId;

        return (
          <div
            key={comment.id}
            className="flex items-start gap-2 px-4 py-3 hover:bg-[var(--instagram-background)] transition-colors group"
          >
            {/* 프로필 이미지 영역 (향후 추가) */}
            <div className="w-8 h-8 rounded-full bg-[var(--instagram-border)] flex-shrink-0 flex items-center justify-center">
              <span className="text-[var(--text-secondary)] text-xs font-instagram-bold">
                {comment.user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* 댓글 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Link
                    href={`/profile/${comment.user.clerk_id}`}
                    className="font-instagram-bold text-[var(--text-primary)] text-instagram-sm hover:opacity-70 transition-opacity inline-block"
                  >
                    {comment.user.name}
                  </Link>
                  <span className="ml-2 text-[var(--text-primary)] text-instagram-sm">
                    {comment.content}
                  </span>
                </div>

                {/* 삭제 버튼 (본인만 표시) */}
                {isOwnComment && onDelete && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() =>
                        setShowDeleteMenu(
                          showDeleteMenu === comment.id ? null : comment.id
                        )
                      }
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70"
                      aria-label="댓글 메뉴"
                    >
                      <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>

                    {/* 삭제 메뉴 */}
                    {showDeleteMenu === comment.id && (
                      <div className="absolute right-0 top-8 bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-md shadow-lg z-10 min-w-[120px]">
                        <button
                          onClick={() => handleDeleteClick(comment.id)}
                          className="w-full px-4 py-2 text-left text-[var(--like-red)] text-instagram-sm hover:bg-[var(--instagram-background)] transition-colors rounded-md"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 댓글 시간 */}
              <div className="mt-1">
                <span className="text-[var(--text-secondary)] text-instagram-xs">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

