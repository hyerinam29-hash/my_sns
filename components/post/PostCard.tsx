"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, memo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PostCommentModal from "./PostCommentModal";
import PostModal from "./PostModal";

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
  onDelete?: () => void; // 게시물 삭제 후 콜백 (피드 업데이트용)
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

/**
 * PostCard 컴포넌트 (React.memo로 최적화)
 * 
 * props가 변경되지 않으면 리렌더링을 방지하여 성능을 향상시킵니다.
 */
const PostCard = function PostCard({ 
  post, 
  user, 
  likesCount: initialLikesCount = 0, 
  commentsCount = 0, 
  previewComments = [],
  onDelete
}: PostCardProps) {
  const { userId: clerkUserId, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const lastTapRef = useRef<number>(0);
  const checkedInitialLikeRef = useRef(false);
  
  // 본인 게시물인지 확인
  const isOwnPost = clerkUserId === user.clerk_id;

  // 초기 좋아요 상태 확인
  useEffect(() => {
    if (!isLoaded || !clerkUserId || checkedInitialLikeRef.current) return;

    const checkInitialLike = async () => {
      try {
        // Supabase users 테이블에서 user_id 조회
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerkUserId)
          .single();

        if (!userData) return;

        // 현재 사용자가 이 게시물을 좋아요했는지 확인
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", userData.id)
          .eq("post_id", post.id)
          .single();

        if (likeData) {
          setIsLiked(true);
        }
      } catch (error) {
        // 좋아요가 없으면 에러가 발생할 수 있음 (정상)
        console.log("초기 좋아요 상태 확인:", error);
      } finally {
        checkedInitialLikeRef.current = true;
      }
    };

    checkInitialLike();
  }, [isLoaded, clerkUserId, supabase, post.id]);

  // 좋아요 추가/취소 API 호출
  const toggleLike = async () => {
    if (!isLoaded || !clerkUserId || isLiking) return;

    const wasLiked = isLiked;
    const previousLikesCount = likesCount;

    // 낙관적 업데이트 (Optimistic Update)
    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? previousLikesCount - 1 : previousLikesCount + 1);
    setIsLiking(true);

    try {
      console.group("❤️ 좋아요 토글");
      console.log("post_id:", post.id, "wasLiked:", wasLiked);

      const response = await fetch("/api/likes", {
        method: wasLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: post.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 이미 좋아요가 있는 경우 (409)는 실제로는 성공
        if (response.status === 409 && !wasLiked) {
          console.log("이미 좋아요가 존재함 (성공 처리)");
          setIsLiked(true);
          setLikesCount(previousLikesCount + 1);
        } else {
          throw new Error(errorData.error || "좋아요 처리 실패");
        }
      } else {
        console.log("좋아요 처리 성공");
      }

      console.groupEnd();
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      
      // 실패 시 롤백
      setIsLiked(wasLiked);
      setLikesCount(previousLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  // 더블탭 좋아요 이벤트 (모바일)
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms 이내 더블탭 감지

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      if (!isLiked && !isLiking) {
        setShowDoubleTapHeart(true);
        setTimeout(() => {
          setShowDoubleTapHeart(false);
        }, 1000);
        toggleLike();
      }
    }

    lastTapRef.current = now;
  };

  // 이미지 클릭 핸들러 (데스크톱에서만 모달 열기)
  const handleImageClick = (e: React.MouseEvent) => {
    // 더블탭 이벤트와 충돌 방지 (더블탭 후 클릭은 무시)
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      return; // 더블탭 직후 클릭은 무시
    }

    // 데스크톱(1024px 이상)에서만 PostModal 열기
    if (window.innerWidth >= 1024) {
      console.log("🖥️ 데스크톱 - 게시물 상세 모달 열기");
      setIsPostModalOpen(true);
    } else {
      // 모바일에서는 페이지로 이동 (더블탭이 아닌 경우에만)
      e.preventDefault();
      console.log("📱 모바일 - 게시물 상세 페이지로 이동");
      window.location.href = `/post/${post.id}`;
    }
  };

  // 좋아요 버튼 클릭
  const handleLikeClick = () => {
    if (!isLiking) {
      toggleLike();
    }
  };

  /**
   * 게시물 삭제
   */
  const handleDelete = async () => {
    if (!isOwnPost || isDeleting) return;

    // 삭제 확인 다이얼로그
    if (!confirm("정말 이 게시물을 삭제하시겠습니까?\n삭제된 게시물은 복구할 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    try {
      console.group("🗑️ 게시물 삭제");
      console.log("post_id:", post.id);

      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "게시물 삭제에 실패했습니다.");
      }

      console.log("게시물 삭제 성공");
      console.groupEnd();

      // 피드 업데이트 콜백 호출
      if (onDelete) {
        onDelete();
      }

      // 피드 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent("postDeleted", {
        detail: { postId: post.id }
      }));
    } catch (error) {
      console.error("게시물 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "게시물 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="더보기 메뉴"
              disabled={isDeleting}
            >
              <MoreHorizontal className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwnPost && (
              <>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "삭제 중..." : "삭제"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              신고
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Image 영역 (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-[var(--instagram-background)]">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover lg:cursor-pointer"
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false} // lazy loading 활성화 (첫 화면 게시물이 아니므로)
          loading="lazy" // 브라우저 레벨 lazy loading
          quality={85} // 이미지 품질 최적화 (기본값 75보다 약간 높게)
          onDoubleClick={handleDoubleTap}
          onClick={handleImageClick}
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
            disabled={isLiking || !isLoaded}
            className="p-1 hover:opacity-70 transition-all duration-150 active:scale-[1.3] disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={() => setIsCommentModalOpen(true)}
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
            onClick={() => setIsCommentModalOpen(true)}
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

      {/* 댓글 모달 (모바일용) */}
      <PostCommentModal
        postId={post.id}
        open={isCommentModalOpen}
        onOpenChange={setIsCommentModalOpen}
        onCommentUpdate={(action) => {
          // 댓글 작성/삭제 후 피드 새로고침을 위해 부모 컴포넌트에 알림
          // PostFeed에서 처리할 수 있도록 window 이벤트 발생
          window.dispatchEvent(new CustomEvent("commentUpdated", {
            detail: { postId: post.id, action }
          }));
        }}
      />

      {/* 게시물 상세 모달 (데스크톱용) */}
      <PostModal
        postId={post.id}
        open={isPostModalOpen}
        onOpenChange={setIsPostModalOpen}
      />
    </article>
  );
};

/**
 * React.memo로 PostCard 최적화
 * 
 * props가 변경되지 않으면 리렌더링을 방지합니다.
 * 비교 함수를 사용하여 likesCount, commentsCount, previewComments만 변경되었을 때만 리렌더링합니다.
 */
export default memo(PostCard, (prevProps, nextProps) => {
  // post 객체 비교
  if (
    prevProps.post.id !== nextProps.post.id ||
    prevProps.post.image_url !== nextProps.post.image_url ||
    prevProps.post.caption !== nextProps.post.caption ||
    prevProps.post.created_at !== nextProps.post.created_at
  ) {
    return false; // props가 다르므로 리렌더링 필요
  }

  // user 객체 비교
  if (
    prevProps.user.id !== nextProps.user.id ||
    prevProps.user.clerk_id !== nextProps.user.clerk_id ||
    prevProps.user.name !== nextProps.user.name
  ) {
    return false;
  }

  // 숫자 값 비교
  if (
    prevProps.likesCount !== nextProps.likesCount ||
    prevProps.commentsCount !== nextProps.commentsCount
  ) {
    return false;
  }

  // previewComments 배열 비교
  if (prevProps.previewComments?.length !== nextProps.previewComments?.length) {
    return false;
  }

  if (prevProps.previewComments) {
    for (let i = 0; i < prevProps.previewComments.length; i++) {
      const prev = prevProps.previewComments[i];
      const next = nextProps.previewComments[i];
      if (
        prev.id !== next.id ||
        prev.content !== next.content ||
        prev.user.name !== next.user.name
      ) {
        return false;
      }
    }
  }

  // onDelete 함수는 참조 비교 (일반적으로 동일)
  // 모든 props가 동일하므로 리렌더링 불필요
  return true;
});

