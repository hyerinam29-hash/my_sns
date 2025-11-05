"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

/**
 * PostFeed 컴포넌트
 * 
 * 게시물 목록을 표시하고 무한 스크롤을 구현합니다.
 * 
 * 주요 기능:
 * 1. 게시물 목록 조회 (페이지네이션) - API 라우트 사용
 * 2. Intersection Observer를 사용한 무한 스크롤
 * 3. 로딩 상태 처리 (PostCardSkeleton)
 * 4. 중복 로드 방지 (요청 중 플래그)
 * 5. offset 기반 페이지네이션
 * 
 * @dependencies
 * - /api/posts: 게시물 목록 조회 API
 */
interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user: {
    id: string;
    clerk_id: string;
    name: string;
  };
  likes_count: number;
  comments_count: number;
  preview_comments: Array<{
    id: string;
    user: {
      name: string;
      clerk_id?: string;
    };
    content: string;
  }>;
}

const POSTS_PER_PAGE = 10;

interface PostFeedProps {
  onPostCreated?: () => void;
}

export default function PostFeed({}: PostFeedProps = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false); // 중복 로드 방지 플래그

  /**
   * 게시물 목록 가져오기 (API 라우트 사용)
   * 
   * @param offset - 현재 오프셋 (페이지네이션)
   * @param append - 기존 게시물에 추가할지 여부
   */
  const fetchPosts = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      // 중복 로드 방지: 이미 요청 중이면 무시
      if (isLoadingRef.current) {
        console.log("⚠️ 이미 로딩 중 - 요청 무시");
        return;
      }

      // 더 이상 가져올 게시물이 없으면 무시
      if (!hasMore && append) {
        console.log("⚠️ 더 이상 가져올 게시물 없음");
        return;
      }

      try {
        isLoadingRef.current = true; // 요청 시작 플래그 설정

        if (!append) {
          setLoading(true);
          offsetRef.current = 0; // 초기 로드 시 offset 리셋
        } else {
          setLoadingMore(true);
        }
        setError(null);

        console.group("📥 게시물 목록 가져오기");
        console.log("offset:", offset, "append:", append);

        // API 라우트를 통해 게시물 목록 조회
        const response = await fetch(
          `/api/posts?limit=${POSTS_PER_PAGE}&offset=${offset}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: 게시물을 불러오는데 실패했습니다.`
          );
        }

        const data = await response.json();
        const { posts: postsData, hasMore: hasMoreData } = data;

        console.log("게시물 개수:", postsData?.length || 0);
        console.log("더 가져올 게시물 있음:", hasMoreData);

        if (!postsData || postsData.length === 0) {
          setHasMore(false);
          if (!append) {
            setPosts([]);
          }
          console.log("게시물 없음");
          console.groupEnd();
          return;
        }

        // 게시물 목록 업데이트
        if (append) {
          setPosts((prev) => [...prev, ...postsData]);
        } else {
          setPosts(postsData);
        }

        // 더 가져올 게시물이 있는지 확인
        setHasMore(hasMoreData);

        // offset 업데이트
        offsetRef.current = offset + postsData.length;

        console.log("✅ 게시물 로드 완료:", postsData.length, "개");
        console.groupEnd();
      } catch (err) {
        console.error("❌ 게시물 가져오기 오류:", err);
        setError(
          err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isLoadingRef.current = false; // 요청 완료 플래그 해제
      }
    },
    [hasMore]
  );

  /**
   * 피드 새로고침 함수
   * 게시물 작성 후 또는 수동 새로고침 시 사용
   */
  const refresh = useCallback(() => {
    console.log("🔄 피드 새로고침");
    offsetRef.current = 0;
    setHasMore(true);
    setError(null);
    fetchPosts(0, false);
  }, [fetchPosts]);

  // 댓글 업데이트 이벤트 리스너
  useEffect(() => {
    const handleCommentUpdate = (event: CustomEvent) => {
      const { postId, action } = event.detail; // action: 'add' | 'delete'
      console.log("💬 댓글 업데이트 이벤트 수신:", postId, "action:", action);
      
      // 전체 피드 새로고침 대신 해당 게시물의 댓글 수만 업데이트
      setPosts((prev) => 
        prev.map((post) => {
          if (post.id === postId) {
            // 댓글 추가 시 증가, 삭제 시 감소
            const newCommentsCount = action === 'delete' 
              ? Math.max(0, (post.comments_count || 0) - 1)
              : (post.comments_count || 0) + 1;
            
            return {
              ...post,
              comments_count: newCommentsCount,
            };
          }
          return post;
        })
      );
    };

    window.addEventListener("commentUpdated", handleCommentUpdate as EventListener);

    return () => {
      window.removeEventListener("commentUpdated", handleCommentUpdate as EventListener);
    };
  }, []);

  // 게시물 삭제 이벤트 리스너
  useEffect(() => {
    const handlePostDelete = (event: CustomEvent) => {
      const { postId } = event.detail;
      console.log("🗑️ 게시물 삭제 이벤트 수신:", postId);
      
      // 삭제된 게시물을 피드에서 제거
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    };

    window.addEventListener("postDeleted", handlePostDelete as EventListener);

    return () => {
      window.removeEventListener("postDeleted", handlePostDelete as EventListener);
    };
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  /**
   * Intersection Observer 설정 (무한 스크롤)
   * 
   * 하단 감지 영역이 뷰포트에 들어오면 다음 페이지를 자동으로 로드합니다.
   * - threshold: 0.1 (10% 보이면 트리거)
   * - rootMargin: 100px (뷰포트 하단 100px 전에 미리 로드)
   */
  useEffect(() => {
    // 더 이상 가져올 게시물이 없거나 로딩 중이면 Observer 설정하지 않음
    if (!hasMore || loading || loadingMore || isLoadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        // 감지 영역이 뷰포트에 들어왔고, 추가 조건 확인
        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !isLoadingRef.current
        ) {
          console.log("🔄 하단 도달 - 다음 페이지 로드");
          console.log("현재 offset:", offsetRef.current);
          fetchPosts(offsetRef.current, true);
        }
      },
      {
        threshold: 0.1, // 10% 보이면 트리거
        rootMargin: "100px", // 뷰포트 하단 100px 전에 미리 로드
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, fetchPosts]);

  // 로딩 중일 때 Skeleton 표시
  if (loading) {
    return (
      <div className="space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="rounded-lg bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] p-4">
        <p className="text-[var(--text-secondary)] text-center text-instagram-sm">
          {error}
        </p>
        <button
          onClick={() => fetchPosts(0, false)}
          className="mt-4 mx-auto block text-[var(--instagram-blue)] hover:opacity-70 transition-opacity text-instagram-sm"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 게시물이 없을 때
  if (posts.length === 0) {
    return (
      <div className="rounded-lg bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] p-4">
        <p className="text-[var(--text-secondary)] text-center text-instagram-sm">
          게시물이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 게시물 목록 */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={{
            id: post.id,
            image_url: post.image_url,
            caption: post.caption,
            created_at: post.created_at,
          }}
          user={post.user}
          likesCount={post.likes_count}
          commentsCount={post.comments_count}
          previewComments={post.preview_comments}
          onDelete={() => {
            // 게시물 삭제 후 피드에서 제거
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          }}
        />
      ))}

      {/* 무한 스크롤 감지 영역 및 로딩 인디케이터 */}
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {loadingMore && (
            <div className="space-y-4">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          )}
          {!loadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="text-[var(--text-secondary)] text-sm">
                더 많은 게시물을 불러오는 중...
              </div>
            </div>
          )}
        </div>
      )}

      {/* 더 이상 가져올 게시물이 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-[var(--text-secondary)] text-sm">
            모든 게시물을 불러왔습니다.
          </p>
        </div>
      )}
    </div>
  );
}

