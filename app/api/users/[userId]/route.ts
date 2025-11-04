import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 사용자 정보 조회 API
 * 
 * GET: 특정 사용자의 프로필 정보 조회
 * - 사용자 기본 정보 (id, clerk_id, name, created_at)
 * - 게시물 수
 * - 팔로워 수
 * - 팔로잉 수
 * 
 * @param userId - Clerk user ID (clerk_id) 또는 Supabase UUID (id)
 */

interface UserProfileResponse {
  id: string;
  clerk_id: string;
  name: string;
  created_at: string;
  stats: {
    posts_count: number;
    followers_count: number;
    following_count: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.group("📥 API: 사용자 프로필 조회");
    
    const { userId } = await params;
    console.log("조회할 사용자 ID:", userId);

    const supabase = createClerkSupabaseClient();

    // userId가 UUID 형식인지 확인 (UUID는 36자리, 하이픈 포함)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    // 사용자 정보 조회 (clerk_id 또는 id로 조회)
    let userQuery = supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .single();

    if (isUUID) {
      // UUID 형식이면 id로 조회
      userQuery = userQuery.eq("id", userId);
      console.log("UUID 형식으로 조회");
    } else {
      // 아니면 clerk_id로 조회
      userQuery = userQuery.eq("clerk_id", userId);
      console.log("Clerk ID 형식으로 조회");
    }

    const { data: user, error: userError } = await userQuery;

    if (userError || !user) {
      console.error("사용자 조회 오류:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("사용자 정보:", user.name);

    // 통계 정보 조회
    const userIdForStats = user.id; // Supabase UUID 사용

    // 게시물 수
    const { count: postsCount, error: postsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userIdForStats);

    if (postsError) {
      console.error("게시물 수 조회 오류:", postsError);
    }

    // 팔로워 수 (다른 사람이 이 사용자를 팔로우하는 수)
    const { count: followersCount, error: followersError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userIdForStats);

    if (followersError) {
      console.error("팔로워 수 조회 오류:", followersError);
    }

    // 팔로잉 수 (이 사용자가 다른 사람을 팔로우하는 수)
    const { count: followingCount, error: followingError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userIdForStats);

    if (followingError) {
      console.error("팔로잉 수 조회 오류:", followingError);
    }

    const response: UserProfileResponse = {
      id: user.id,
      clerk_id: user.clerk_id,
      name: user.name,
      created_at: user.created_at,
      stats: {
        posts_count: postsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      },
    };

    console.log("통계:", response.stats);
    console.groupEnd();

    return NextResponse.json(response);
  } catch (error) {
    console.error("사용자 프로필 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

