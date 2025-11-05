import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 팔로우 API 라우트
 * 
 * POST: 팔로우 추가
 * DELETE: 언팔로우
 * 
 * 인증: Clerk user ID 검증 필수
 * 요청 body: { following_id: string } (팔로우할 사용자의 clerk_id 또는 UUID)
 */

interface FollowRequest {
  following_id: string; // 팔로우할 사용자의 clerk_id 또는 UUID
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
 * 사용자 ID (clerk_id 또는 UUID)를 Supabase UUID로 변환
 */
async function getSupabaseUserIdFromIdentifier(identifier: string) {
  const supabase = createClerkSupabaseClient();
  
  // UUID 형식인지 확인 (UUID는 36자리, 하이픈 포함)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let userQuery;
  
  if (isUUID) {
    // UUID 형식이면 id로 조회
    userQuery = supabase
      .from("users")
      .select("id")
      .eq("id", identifier)
      .single();
  } else {
    // 아니면 clerk_id로 조회
    userQuery = supabase
      .from("users")
      .select("id")
      .eq("clerk_id", identifier)
      .single();
  }

  const { data: user, error } = await userQuery;

  if (error || !user) {
    console.error("사용자 조회 오류:", error);
    return null;
  }

  return user.id;
}

/**
 * POST: 팔로우 추가
 * 
 * 요청 body: { following_id: string }
 * 
 * 응답: { success: true, follow: Follow }
 */
export async function POST(request: NextRequest) {
  try {
    console.group("👥 API: 팔로우 추가");

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
    const body: FollowRequest = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return NextResponse.json(
        { error: "following_id가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("following_id:", following_id);

    // Supabase user_id 조회 (팔로우하는 사람 = 현재 사용자)
    const followerUserId = await getSupabaseUserId(clerkUserId);

    if (!followerUserId) {
      console.error("Supabase 사용자 없음");
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("Supabase follower_user_id:", followerUserId);

    // 팔로우할 사용자 ID 조회
    const followingUserId = await getSupabaseUserIdFromIdentifier(following_id);

    if (!followingUserId) {
      console.error("팔로우할 사용자를 찾을 수 없음");
      return NextResponse.json(
        { error: "팔로우할 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("Supabase following_user_id:", followingUserId);

    // 자기 자신 팔로우 방지 (API 레벨에서 확인)
    if (followerUserId === followingUserId) {
      console.error("자기 자신 팔로우 시도");
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 팔로우 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data: follow, error: followError } = await supabase
      .from("follows")
      .insert({
        follower_id: followerUserId,
        following_id: followingUserId,
      })
      .select()
      .single();

    if (followError) {
      // 이미 팔로우 중인 경우 (UNIQUE 제약조건 위반)
      if (followError.code === "23505") {
        console.log("이미 팔로우 중");
        return NextResponse.json(
          { error: "이미 팔로우 중인 사용자입니다.", already_following: true },
          { status: 409 }
        );
      }

      // 자기 자신 팔로우 시도 (CHECK 제약조건 위반)
      if (followError.code === "23514") {
        console.error("자기 자신 팔로우 시도 (DB 제약조건)");
        return NextResponse.json(
          { error: "자기 자신을 팔로우할 수 없습니다." },
          { status: 400 }
        );
      }

      console.error("팔로우 추가 오류:", followError);
      return NextResponse.json(
        { error: "팔로우 추가에 실패했습니다.", details: followError.message },
        { status: 500 }
      );
    }

    console.log("팔로우 추가 성공:", follow.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      follow: follow,
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
 * DELETE: 언팔로우
 * 
 * 요청 body: { following_id: string }
 * 
 * 응답: { success: true }
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("👋 API: 언팔로우");

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
    const body: FollowRequest = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return NextResponse.json(
        { error: "following_id가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("following_id:", following_id);

    // Supabase user_id 조회 (언팔로우하는 사람 = 현재 사용자)
    const followerUserId = await getSupabaseUserId(clerkUserId);

    if (!followerUserId) {
      console.error("Supabase 사용자 없음");
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("Supabase follower_user_id:", followerUserId);

    // 언팔로우할 사용자 ID 조회
    const followingUserId = await getSupabaseUserIdFromIdentifier(following_id);

    if (!followingUserId) {
      console.error("언팔로우할 사용자를 찾을 수 없음");
      return NextResponse.json(
        { error: "언팔로우할 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("Supabase following_user_id:", followingUserId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 언팔로우 (팔로우 관계 삭제)
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerUserId)
      .eq("following_id", followingUserId);

    if (deleteError) {
      console.error("언팔로우 오류:", deleteError);
      return NextResponse.json(
        { error: "언팔로우에 실패했습니다.", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("언팔로우 성공");
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

