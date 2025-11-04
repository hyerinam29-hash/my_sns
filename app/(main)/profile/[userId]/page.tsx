/**
 * 사용자 프로필 페이지
 * 
 * @description
 * 특정 사용자의 프로필 정보를 표시하는 페이지입니다.
 * - 사용자 기본 정보 (이름, 프로필 이미지)
 * - 통계 정보 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 본인 프로필 vs 다른 사람 프로필 구분
 * 
 * @param params - userId: 사용자 ID (Clerk user ID 또는 UUID)
 * 
 * @dependencies
 * - @clerk/nextjs/server: 인증 확인 (auth)
 * - @/lib/supabase/server: Supabase 클라이언트 (createClerkSupabaseClient)
 */
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostGrid from "@/components/profile/PostGrid";

interface UserProfile {
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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  console.group("📄 프로필 페이지 렌더링");
  
  const { userId } = await params;
  console.log("조회할 사용자 ID:", userId);

  // 현재 로그인한 사용자 확인
  const { userId: currentUserId } = await auth();
  console.log("현재 로그인한 사용자 ID:", currentUserId || "비로그인");

  // Supabase 클라이언트 생성
  const supabase = createClerkSupabaseClient();
  let userProfile: UserProfile | null = null;
  let isOwnProfile = false;

  try {
    // userId가 UUID 형식인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    // 사용자 정보 조회
    let userQuery = supabase
      .from("users")
      .select("id, clerk_id, name, created_at");

    if (isUUID) {
      userQuery = userQuery.eq("id", userId);
      console.log("UUID 형식으로 조회");
    } else {
      userQuery = userQuery.eq("clerk_id", userId);
      console.log("Clerk ID 형식으로 조회");
    }

    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      console.error("사용자 조회 오류:", userError);
      console.groupEnd();
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              사용자를 찾을 수 없습니다
            </h1>
            <p className="text-[var(--text-secondary)]">
              요청하신 사용자 프로필이 존재하지 않습니다.
            </p>
          </div>
        </div>
      );
    }

    console.log("사용자 정보 조회 성공:", user.name);

    // 본인 프로필인지 확인 (Clerk user ID 비교)
    isOwnProfile = currentUserId === user.clerk_id;
    console.log("본인 프로필 여부:", isOwnProfile);

    // 통계 정보 조회
    const userIdForStats = user.id; // Supabase UUID 사용

    // 게시물 수
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userIdForStats);

    // 팔로워 수
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userIdForStats);

    // 팔로잉 수
    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userIdForStats);

    userProfile = {
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

    console.log("통계:", userProfile.stats);
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
  }

  console.groupEnd();

  // 사용자를 찾을 수 없는 경우 (에러 처리)
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            사용자를 찾을 수 없습니다
          </h1>
          <p className="text-[var(--text-secondary)]">
            요청하신 사용자 프로필이 존재하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 프로필 헤더 컴포넌트 */}
      <ProfileHeader
        user={userProfile}
        stats={userProfile.stats}
        isOwnProfile={isOwnProfile}
        fullName={userProfile.name}
        bio={undefined}
      />

      {/* 게시물 그리드 영역 */}
      <div className="bg-[var(--card-background)] border border-[var(--border)] rounded-lg p-6">
        <div className="border-b border-[var(--border)] pb-4 mb-6">
          <div className="flex gap-8">
            <button className="flex items-center gap-2 text-[var(--text-primary)] font-semibold border-b-2 border-[var(--text-primary)] pb-2">
              <svg
                className="w-5 h-5"
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
              게시물
            </button>
            {/* TODO: 릴스, 태그됨 탭 추가 (향후 구현) */}
          </div>
        </div>

        {/* PostGrid 컴포넌트 */}
        <PostGrid userId={userProfile.clerk_id} />
      </div>
    </div>
  );
}

