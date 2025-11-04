"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

/**
 * PostFeed 컴포넌트
 * 
 * 게시물 목록을 표시하고 무한 스크롤을 구현합니다.
 * 
 * 주요 기능:
 * 1. 게시물 목록 조회 (페이지네이션)
 * 2. Intersection Observer를 사용한 무한 스크롤
 * 3. 로딩 상태 처리 (PostCardSkeleton)
 * 4. 좋아요 수, 댓글 수 집계
 * 5. 댓글 미리보기 (최신 2개)
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

export default function PostFeed() {
  const supabase = useClerkSupabaseClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  /**
   * 게시물 목록 가져오기
   */
  const fetchPosts = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        console.group("📥 게시물 목록 가져오기");
        console.log("offset:", offset, "append:", append);

        // 게시물 목록 조회 (사용자 정보 JOIN)
        const { data: postsData, error: postsError } = await supabase
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
          .order("created_at", { ascending: false })
          .range(offset, offset + POSTS_PER_PAGE - 1);

        if (postsError) throw postsError;

        console.log("게시물 개수:", postsData?.length || 0);

        if (!postsData || postsData.length === 0) {
          setHasMore(false);
          if (!append) {
            setLoading(false);
          } else {
            setLoadingMore(false);
          }
          return;
        }

        // 각 게시물에 대해 좋아요 수, 댓글 수, 댓글 미리보기 가져오기
        const postsWithStats = await Promise.all(
          postsData.map(async (post: any) => {
            const postId = post.id;

            // 좋아요 수 집계
            const { count: likesCount } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", postId);

            // 댓글 수 집계
            const { count: commentsCount } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", postId);

            // 댓글 미리보기 (최신 2개)
            const { data: previewComments } = await supabase
              .from("comments")
              .select(
                `
                id,
                content,
                user_id,
                users!inner (
                  name,
                  clerk_id
                )
              `
              )
              .eq("post_id", postId)
              .order("created_at", { ascending: false })
              .limit(2);

            return {
              id: post.id,
              image_url: post.image_url,
              caption: post.caption,
              created_at: post.created_at,
              user: {
                id: post.users.id,
                clerk_id: post.users.clerk_id,
                name: post.users.name,
              },
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              preview_comments:
                previewComments?.map((comment: any) => ({
                  id: comment.id,
                  user: {
                    name: comment.users.name,
                    clerk_id: comment.users.clerk_id,
                  },
                  content: comment.content,
                })) || [],
            };
          })
        );

        console.log("집계 완료된 게시물:", postsWithStats.length);

        if (append) {
          setPosts((prev) => [...prev, ...postsWithStats]);
        } else {
          setPosts(postsWithStats);
        }

        // 더 가져올 게시물이 있는지 확인
        if (postsWithStats.length < POSTS_PER_PAGE) {
          setHasMore(false);
        }

        offsetRef.current = offset + postsWithStats.length;
        console.groupEnd();
      } catch (err) {
        console.error("게시물 가져오기 오류:", err);
        setError(
          err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [supabase]
  );

  // 초기 로드
  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Intersection Observer 설정 (무한 스크롤)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          console.log("🔄 하단 도달 - 다음 페이지 로드");
          fetchPosts(offsetRef.current, true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
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
        />
      ))}

      {/* 무한 스크롤 감지 영역 */}
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {loadingMore && (
            <div className="space-y-4">
              <PostCardSkeleton />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

