import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 댓글 API 라우트
 * 
 * GET: 댓글 목록 조회 (post_id 기준)
 * POST: 댓글 작성
 * DELETE: 댓글 삭제 (본인만)
 * 
 * 인증: Clerk user ID 검증 필수 (POST, DELETE)
 */

interface CreateCommentRequest {
  post_id: string;
  content: string;
}

interface DeleteCommentRequest {
  comment_id: string;
}

/**
 * Clerk user ID를 Supabase user_id로 변환
 */
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

/**
 * GET: 댓글 목록 조회
 * 
 * Query parameters: post_id (필수)
 * 
 * 응답: { comments: Comment[] }
 */
export async function GET(request: NextRequest) {
  try {
    console.group("💬 API: 댓글 목록 조회");

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("post_id");

    if (!postId) {
      return NextResponse.json(
        { error: "post_id가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("post_id:", postId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 댓글 목록 조회 (사용자 정보 JOIN, 최신순 정렬)
    const { data: comments, error: commentsError } = await supabase
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

    if (commentsError) {
      console.error("댓글 조회 오류:", commentsError);
      return NextResponse.json(
        {
          error: "댓글을 불러오는데 실패했습니다.",
          details: commentsError.message,
        },
        { status: 500 }
      );
    }

    // 응답 형식 변환
    const formattedComments = comments?.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.users.id,
        clerk_id: comment.users.clerk_id,
        name: comment.users.name,
      },
    })) || [];

    console.log("댓글 개수:", formattedComments.length);
    console.groupEnd();

    return NextResponse.json({
      comments: formattedComments,
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
 * POST: 댓글 작성
 * 
 * 요청 body: { post_id: string, content: string }
 * 
 * 응답: { success: true, comment: Comment }
 */
export async function POST(request: NextRequest) {
  try {
    console.group("💬 API: 댓글 작성");

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
    const body: CreateCommentRequest = await request.json();
    const { post_id, content } = body;

    // 필수 필드 검증
    if (!post_id) {
      return NextResponse.json(
        { error: "post_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "댓글 내용이 필요합니다." },
        { status: 400 }
      );
    }

    console.log("post_id:", post_id);
    console.log("content:", content.substring(0, 50) + (content.length > 50 ? "..." : ""));

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

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      console.error("게시물 조회 오류:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 작성
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        user_id: userId,
        post_id: post_id,
        content: content.trim(),
      })
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
      .single();

    if (commentError) {
      console.error("댓글 작성 오류:", commentError);
      return NextResponse.json(
        {
          error: "댓글 작성에 실패했습니다.",
          details: commentError.message,
        },
        { status: 500 }
      );
    }

    // 응답 형식 변환
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.users.id,
        clerk_id: comment.users.clerk_id,
        name: comment.users.name,
      },
    };

    console.log("댓글 작성 성공:", comment.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      comment: formattedComment,
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
 * DELETE: 댓글 삭제 (본인만)
 * 
 * 요청 body: { comment_id: string }
 * 
 * 응답: { success: true }
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("🗑️ API: 댓글 삭제");

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
    const body: DeleteCommentRequest = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: "comment_id가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("comment_id:", comment_id);

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

    // 댓글 존재 및 소유권 확인
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", comment_id)
      .single();

    if (commentError || !comment) {
      console.error("댓글 조회 오류:", commentError);
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 댓글인지 확인
    if (comment.user_id !== userId) {
      console.error("본인 댓글이 아님");
      return NextResponse.json(
        { error: "본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment_id)
      .eq("user_id", userId); // 이중 확인 (보안)

    if (deleteError) {
      console.error("댓글 삭제 오류:", deleteError);
      return NextResponse.json(
        {
          error: "댓글 삭제에 실패했습니다.",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    console.log("댓글 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
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

