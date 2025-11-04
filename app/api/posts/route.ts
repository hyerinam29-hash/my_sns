import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
 * POST: 게시물 생성
 * - 이미지 URL 및 캡션으로 게시물 생성
 * - 인증 검증 (Clerk user ID)
 * - posts 테이블에 레코드 생성
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
    const userId = searchParams.get("userId"); // 특정 사용자의 게시물만 필터링

    console.log("limit:", limit, "offset:", offset, "userId:", userId || "전체");

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    let targetUserId: string | null = null;

    if (userId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      if (isUUID) {
        // UUID 형식이면 직접 사용
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
          return NextResponse.json({
            posts: [],
            hasMore: false,
          });
        }

        targetUserId = user.id;
        console.log("Clerk ID로 사용자 조회 후 필터링");
      }
    }

    // 게시물 목록 조회 (사용자 정보 JOIN)
    let postsQuery = supabase
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

    // 특정 사용자의 게시물만 필터링
    if (targetUserId) {
      postsQuery = postsQuery.eq("user_id", targetUserId);
    }

    const { data: postsData, error: postsError } = await postsQuery;

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

/**
 * POST: 게시물 생성
 * 
 * 요청 body: { image_url: string, caption?: string }
 * - image_url: Supabase Storage에 업로드된 이미지의 공개 URL
 * - caption: 게시물 캡션 (선택사항, 최대 2,200자)
 * 
 * 인증: Clerk user ID 검증 필수
 * 
 * 응답: { success: true, post: { id, image_url, caption, created_at, user_id } }
 */
interface CreatePostRequest {
  image_url: string;
  caption?: string;
}

async function getSupabaseUserId(clerkUserId: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (error) {
    console.error("사용자 조회 오류:", error);
    return null;
  }

  return user?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    console.group("📝 API: 게시물 생성");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      console.error("인증되지 않은 사용자");
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("Clerk user ID:", clerkUserId);

    // 요청 body 파싱
    const body: CreatePostRequest = await request.json();
    const { image_url, caption } = body;

    // 필수 필드 검증
    if (!image_url) {
      return NextResponse.json(
        { error: "image_url이 필요합니다." },
        { status: 400 }
      );
    }

    // 캡션 길이 검증 (최대 2,200자)
    if (caption && caption.length > 2200) {
      return NextResponse.json(
        { error: "캡션은 최대 2,200자까지 입력 가능합니다." },
        { status: 400 }
      );
    }

    console.log("image_url:", image_url);
    console.log("caption:", caption?.substring(0, 50) + (caption && caption.length > 50 ? "..." : ""));

    // Supabase user_id 조회
    const userId = await getSupabaseUserId(clerkUserId);

    if (!userId) {
      console.error("Supabase 사용자 없음");
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("Supabase user_id:", userId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // posts 테이블에 레코드 생성
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: image_url,
        caption: caption || null,
      })
      .select()
      .single();

    if (postError) {
      console.error("게시물 생성 오류:", postError);
      return NextResponse.json(
        {
          error: "게시물 생성에 실패했습니다.",
          details: postError.message,
        },
        { status: 500 }
      );
    }

    console.log("게시물 생성 성공:", post.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      post: post,
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

