"use client";

/**
 * 게시물 그리드 컴포넌트
 * 
 * @description
 * 사용자 프로필 페이지에서 게시물을 3열 그리드로 표시하는 컴포넌트입니다.
 * - 3열 그리드 레이아웃 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 표시
 * - 클릭 시 상세 모달(Desktop) / 페이지(Mobile) 열기
 * 
 * @dependencies
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 * - @/components/post/PostModal: Desktop 모달
 * - next/image: 이미지 최적화
 * - next/link: 페이지 네비게이션
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Heart, MessageCircle } from "lucide-react";
import PostModal from "@/components/post/PostModal";

interface PostGridProps {
  userId: string; // Clerk user ID 또는 UUID
}

interface PostItem {
  id: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
}

export default function PostGrid({ userId }: PostGridProps) {
  const supabase = useClerkSupabaseClient();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      console.group("📥 게시물 그리드 데이터 가져오기");
      console.log("userId:", userId);
      setLoading(true);

      // userId가 UUID 형식인지 확인
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      let targetUserId: string | null = null;

      if (isUUID) {
        targetUserId = userId;
        console.log("UUID 형식으로 사용자 필터링");
      } else {
        // Clerk ID 형식이면 users 테이블에서 UUID 조회
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", userId)
          .single();

        if (userError || !user) {
          console.error("사용자 조회 오류:", userError);
          setPosts([]);
          setLoading(false);
          console.groupEnd();
          return;
        }

        targetUserId = user.id;
        console.log("Clerk ID로 사용자 조회 후 필터링");
      }

      // 게시물 목록 조회
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, image_url")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("게시물 조회 오류:", postsError);
        setPosts([]);
        setLoading(false);
        console.groupEnd();
        return;
      }

      console.log("게시물 개수:", postsData?.length || 0);

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        console.groupEnd();
        return;
      }

      // 각 게시물에 대해 좋아요 수, 댓글 수 가져오기
      const postsWithStats = await Promise.all(
        postsData.map(async (post) => {
          // 좋아요 수
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // 댓글 수
          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          return {
            id: post.id,
            image_url: post.image_url,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
          };
        })
      );

      console.log("집계 완료된 게시물:", postsWithStats.length);
      setPosts(postsWithStats);
    } catch (error) {
      console.error("게시물 그리드 데이터 가져오기 오류:", error);
      setPosts([]);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostClick = (postId: string) => {
    console.log("게시물 클릭:", postId);
    setSelectedPostId(postId);
    
    // Desktop에서는 모달 열기, Mobile에서는 페이지로 이동 (Link로 처리)
    if (window.innerWidth >= 768) {
      setIsModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-[3px]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full border-2 border-[var(--border)] flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-xl font-semibold text-[var(--text-primary)] mb-1">
          게시물 없음
        </p>
        <p className="text-[var(--text-secondary)]">
          아직 게시물이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 3열 그리드 레이아웃 - 반응형 gap 설정 */}
      <div className="grid grid-cols-3 gap-[1px] md:gap-[3px]">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square group cursor-pointer block"
            onClick={(e) => {
              // Desktop에서는 모달 열기, Mobile에서는 기본 링크 동작
              if (window.innerWidth >= 768) {
                e.preventDefault();
                handlePostClick(post.id);
              }
            }}
          >
            {/* 이미지 컨테이너 - 정사각형 비율 유지 */}
            <div className="relative w-full pt-[100%] overflow-hidden bg-gray-100">
              <div className="absolute inset-0">
                <Image
                  src={post.image_url}
                  alt="게시물 이미지"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 310px"
                  priority={false}
                />
              </div>
            </div>

            {/* Hover 시 좋아요/댓글 수 표시 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Heart className="w-5 h-5 fill-white" />
                <span>{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>{post.comments_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop 모달 */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedPostId(null);
            }
          }}
        />
      )}
    </>
  );
}

