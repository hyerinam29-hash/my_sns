"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import CommentList, { Comment } from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";

/**
 * PostModal 컴포넌트
 * 
 * Desktop용 게시물 상세 모달
 * 
 * 주요 기능:
 * 1. 좌측: 이미지 (50%)
 * 2. 우측: 댓글 영역 (50%)
 *    - PostCard Header
 *    - CommentList (스크롤)
 *    - Actions (좋아요, 댓글)
 *    - 좋아요 수, 캡션
 *    - CommentForm
 * 3. 닫기 버튼 (✕)
 * 4. 좋아요 기능
 * 5. 댓글 작성/삭제
 * 
 * @param postId - 게시물 ID
 * @param open - 모달 열림 상태
 * @param onOpenChange - 모달 상태 변경 핸들러
 */
interface PostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PostData {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user: {
    id: string;
    clerk_id: string;
    name: string;
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

export default function PostModal({
  postId,
  open,
  onOpenChange,
}: PostModalProps) {
  const { userId: clerkUserId, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const checkedInitialLikeRef = useRef(false);

  /**
   * 게시물 정보 불러오기
   */
  const fetchPost = async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      console.group("📥 게시물 상세 정보 불러오기");
      console.log("post_id:", postId);

      // 게시물 정보 조회
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(
          `
          id,
          image_url,
          caption,
          created_at,
          user_id,
          users!inner (
            id,
            clerk_id,
            name
          )
        `
        )
        .eq("id", postId)
        .single();

      if (postError) throw postError;

      if (!postData) {
        throw new Error("게시물을 찾을 수 없습니다.");
      }

      console.log("게시물 정보:", postData.id);

      // users는 배열로 반환되므로 첫 번째 요소 사용
      const userData = Array.isArray(postData.users) 
        ? postData.users[0] 
        : postData.users;

      if (!userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      setPost({
        id: postData.id,
        image_url: postData.image_url,
        caption: postData.caption,
        created_at: postData.created_at,
        user: {
          id: userData.id,
          clerk_id: userData.clerk_id,
          name: userData.name,
        },
      });

      // 좋아요 수 집계
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      setLikesCount(likesCount || 0);

      console.log("좋아요 수:", likesCount || 0);
      console.groupEnd();

      // 댓글 목록 불러오기
      await fetchComments();
    } catch (error) {
      console.error("게시물 불러오기 오류:", error);
      alert(error instanceof Error ? error.message : "게시물을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 댓글 목록 불러오기
   */
  const fetchComments = async () => {
    if (!postId) return;

    try {
      console.group("💬 댓글 목록 불러오기");
      console.log("post_id:", postId);

      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          users!inner (
            id,
            clerk_id,
            name
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      const formattedComments: Comment[] = (commentsData || []).map((comment: any) => ({
        id: comment.id,
        user: {
          id: comment.users.id,
          clerk_id: comment.users.clerk_id,
          name: comment.users.name,
        },
        content: comment.content,
        created_at: comment.created_at,
      }));

      console.log("댓글 개수:", formattedComments.length);
      console.groupEnd();

      setComments(formattedComments);
    } catch (error) {
      console.error("댓글 불러오기 오류:", error);
    }
  };

  /**
   * 초기 좋아요 상태 확인
   */
  useEffect(() => {
    if (!isLoaded || !clerkUserId || !postId || !open || checkedInitialLikeRef.current) return;

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
          .eq("post_id", postId)
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
  }, [isLoaded, clerkUserId, supabase, postId, open]);

  /**
   * 좋아요 추가/취소 API 호출
   */
  const toggleLike = async () => {
    if (!isLoaded || !clerkUserId || isLiking || !postId) return;

    const wasLiked = isLiked;
    const previousLikesCount = likesCount;

    // 낙관적 업데이트 (Optimistic Update)
    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? previousLikesCount - 1 : previousLikesCount + 1);
    setIsLiking(true);

    try {
      console.group("❤️ 좋아요 토글");
      console.log("post_id:", postId, "wasLiked:", wasLiked);

      const response = await fetch("/api/likes", {
        method: wasLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId }),
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

  /**
   * 좋아요 버튼 클릭
   */
  const handleLikeClick = () => {
    if (!isLiking) {
      toggleLike();
    }
  };

  /**
   * 댓글 작성
   */
  const handleAddComment = async (content: string) => {
    if (!postId || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.group("💬 댓글 작성");
      console.log("post_id:", postId);
      console.log("content:", content.substring(0, 50));

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "댓글 작성에 실패했습니다.");
      }

      console.log("댓글 작성 성공");
      console.groupEnd();

      // 댓글 목록 새로고침
      await fetchComments();

      // 피드 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent("commentUpdated", {
        detail: { postId }
      }));
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert(error instanceof Error ? error.message : "댓글 작성에 실패했습니다.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 댓글 삭제
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!commentId || isSubmitting) return;

    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.group("🗑️ 댓글 삭제");
      console.log("comment_id:", commentId);

      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "댓글 삭제에 실패했습니다.");
      }

      console.log("댓글 삭제 성공");
      console.groupEnd();

      // 댓글 목록에서 제거
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      // 피드 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent("commentUpdated", {
        detail: { postId }
      }));
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달이 열릴 때 게시물 정보 불러오기
  useEffect(() => {
    if (open && postId) {
      checkedInitialLikeRef.current = false;
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  if (!post) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 gap-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-[var(--text-secondary)] text-instagram-sm">
                게시물을 불러오는 중...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <p className="text-[var(--text-secondary)] text-instagram-sm">
                게시물을 찾을 수 없습니다.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0 gap-0 flex flex-col bg-[var(--instagram-card-background)]">
        {/* 닫기 버튼 (우측 상단) */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 메인 컨텐츠 영역 (좌우 50:50) */}
        <div className="flex flex-1 overflow-hidden">
          {/* 좌측: 이미지 영역 (50%) */}
          <div className="w-1/2 flex-shrink-0 bg-black flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={post.image_url}
                alt={post.caption || "게시물 이미지"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* 우측: 댓글 영역 (50%) */}
          <div className="w-1/2 flex-shrink-0 flex flex-col bg-[var(--instagram-card-background)]">
            {/* PostCard Header (60px) */}
            <header className="h-[60px] flex items-center justify-between px-4 border-b border-[var(--instagram-border)] flex-shrink-0">
              {/* 좌측: 프로필 이미지 + 사용자명 */}
              <div className="flex items-center gap-3">
                {/* 프로필 이미지 (32px 원형) */}
                <Link href={`/profile/${post.user.clerk_id}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--instagram-border)] bg-[var(--instagram-background)] flex items-center justify-center">
                    {/* TODO: 실제 프로필 이미지 URL 사용 */}
                    <span className="text-[var(--text-secondary)] text-xs font-instagram-bold">
                      {post.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>

                {/* 사용자명 + 시간 */}
                <div className="flex flex-col">
                  <Link
                    href={`/profile/${post.user.clerk_id}`}
                    className="font-instagram-bold text-[var(--text-primary)] text-instagram-sm hover:opacity-70 transition-opacity"
                  >
                    {post.user.name}
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

            {/* 댓글 목록 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Actions 영역 (48px) */}
              <div className="h-[48px] flex items-center justify-between px-4 border-b border-[var(--instagram-border)] flex-shrink-0">
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

                  {/* 댓글 버튼 (비활성화 - 이미 댓글 영역에 있음) */}
                  <button
                    className="p-1 opacity-50 cursor-not-allowed"
                    aria-label="댓글"
                    disabled
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

              {/* 좋아요 수, 캡션 */}
              <div className="px-4 py-3 space-y-2 border-b border-[var(--instagram-border)] flex-shrink-0">
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
                      href={`/profile/${post.user.clerk_id}`}
                      className="font-instagram-bold hover:opacity-70 transition-opacity"
                    >
                      {post.user.name}
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
              </div>

              {/* CommentList */}
              <div className="flex-1 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-[var(--text-secondary)] text-instagram-sm">
                      댓글을 불러오는 중...
                    </p>
                  </div>
                ) : (
                  <CommentList
                    comments={comments}
                    onDelete={handleDeleteComment}
                  />
                )}
              </div>
            </div>

            {/* CommentForm (하단 고정) */}
            <div className="border-t border-[var(--instagram-border)] flex-shrink-0">
              <CommentForm
                onSubmit={handleAddComment}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

