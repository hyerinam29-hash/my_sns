import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 좋아요 API 라우트
 * 
 * POST: 좋아요 추가
 * DELETE: 좋아요 취소
 * 
 * 인증: Clerk user ID 검증 필수
 * 요청 body: { post_id: string }
 */

interface LikeRequest {
  post_id: string;
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
 * POST: 좋아요 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("❤️ API: 좋아요 추가");

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
    const body: LikeRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("post_id:", post_id);

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

    // 좋아요 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data: like, error: likeError } = await supabase
      .from("likes")
      .insert({
        user_id: userId,
        post_id: post_id,
      })
      .select()
      .single();

    if (likeError) {
      // 이미 좋아요가 있는 경우 (UNIQUE 제약조건 위반)
      if (likeError.code === "23505") {
        console.log("이미 좋아요가 존재함");
        return NextResponse.json(
          { error: "이미 좋아요를 누른 게시물입니다.", already_liked: true },
          { status: 409 }
        );
      }

      console.error("좋아요 추가 오류:", likeError);
      return NextResponse.json(
        { error: "좋아요 추가에 실패했습니다.", details: likeError.message },
        { status: 500 }
      );
    }

    console.log("좋아요 추가 성공:", like.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      like: like,
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
 * DELETE: 좋아요 취소
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("💔 API: 좋아요 취소");

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
    const body: LikeRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("post_id:", post_id);

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

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", post_id);

    if (deleteError) {
      console.error("좋아요 삭제 오류:", deleteError);
      return NextResponse.json(
        { error: "좋아요 취소에 실패했습니다.", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("좋아요 취소 성공");
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

