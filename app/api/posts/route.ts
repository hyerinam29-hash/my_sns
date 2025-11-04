import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 게시물 API 라우트
 * 
 * GET: 게시물 목록 조회
 * - 페이지네이션 (limit, offset)
 * - 시간 역순 정렬
 * - 사용자 정보 JOIN
 * - 좋아요 수, 댓글 수 집계
 * - 댓글 미리보기 (최신 2개)
 * 
 * POST: 게시물 생성 (5단계에서 구현 예정)
 */

interface PostResponse {
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

export async function GET(request: NextRequest) {
  try {
    console.group("📥 API: 게시물 목록 조회");
    
    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("limit:", limit, "offset:", offset);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

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
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error("게시물 조회 오류:", postsError);
      return NextResponse.json(
        { error: "게시물을 불러오는데 실패했습니다.", details: postsError.message },
        { status: 500 }
      );
    }

    if (!postsData || postsData.length === 0) {
      console.log("게시물 없음");
      console.groupEnd();
      return NextResponse.json({
        posts: [],
        hasMore: false,
      });
    }

    console.log("게시물 개수:", postsData.length);

    // 각 게시물에 대해 좋아요 수, 댓글 수, 댓글 미리보기 가져오기
    const postsWithStats: PostResponse[] = await Promise.all(
      postsData.map(async (post: any) => {
        const postId = post.id;

        // 좋아요 수 집계
        const { count: likesCount, error: likesError } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);

        if (likesError) {
          console.error(`게시물 ${postId} 좋아요 수 조회 오류:`, likesError);
        }

        // 댓글 수 집계
        const { count: commentsCount, error: commentsError } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);

        if (commentsError) {
          console.error(`게시물 ${postId} 댓글 수 조회 오류:`, commentsError);
        }

        // 댓글 미리보기 (최신 2개)
        const { data: previewComments, error: previewError } = await supabase
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

        if (previewError) {
          console.error(`게시물 ${postId} 댓글 미리보기 조회 오류:`, previewError);
        }

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
    console.groupEnd();

    // 더 가져올 게시물이 있는지 확인
    const hasMore = postsWithStats.length === limit;

    return NextResponse.json({
      posts: postsWithStats,
      hasMore,
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST 메서드는 5단계에서 구현 예정
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet. Will be implemented in step 5." },
    { status: 501 }
  );
}

