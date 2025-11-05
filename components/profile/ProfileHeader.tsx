"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";

/**
 * 프로필 헤더 컴포넌트
 * 
 * @description
 * 사용자 프로필 페이지의 헤더 영역을 표시하는 컴포넌트입니다.
 * - 프로필 이미지 (150px Desktop / 90px Mobile)
 * - 사용자명
 * - 통계 정보 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 액션 버튼 (본인: "프로필 편집", 다른 사람: "팔로우"/"팔로잉" + "메시지")
 * - 풀네임 및 바이오
 * - 팔로우/언팔로우 기능 (Instagram 스타일)
 * 
 * @dependencies
 * - Tailwind CSS: 스타일링
 * - Instagram 컬러 스키마: 디자인 시스템
 * - @clerk/nextjs: 인증 상태 확인
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 */

interface ProfileHeaderProps {
  user: {
    id: string;
    clerk_id: string;
    name: string;
    created_at: string;
  };
  stats: {
    posts_count: number;
    followers_count: number;
    following_count: number;
  };
  isOwnProfile: boolean;
  fullName?: string;
  bio?: string;
}

export default function ProfileHeader({
  user,
  stats: initialStats,
  isOwnProfile,
  fullName,
  bio,
}: ProfileHeaderProps) {
  const { userId: clerkUserId, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [stats, setStats] = useState(initialStats);

  console.group("📋 ProfileHeader 렌더링");
  console.log("사용자:", user.name);
  console.log("본인 프로필:", isOwnProfile);
  console.log("통계:", stats);
  console.log("현재 로그인 사용자:", clerkUserId || "비로그인");
  console.log("인증 로드 완료:", isLoaded);
  console.groupEnd();

  /**
   * 초기 팔로우 상태 확인
   */
  useEffect(() => {
    // 본인 프로필인 경우 팔로우 상태 확인 불필요
    if (isOwnProfile) {
      setIsLoading(false);
      return;
    }
    
    // 인증이 완료되지 않은 경우에도 로딩 상태만 해제 (비로그인 사용자도 버튼은 볼 수 있어야 함)
    if (!isLoaded || !clerkUserId) {
      setIsLoading(false);
      setIsFollowing(false); // 비로그인 상태는 미팔로우로 표시
      return;
    }

    const checkFollowStatus = async () => {
      try {
        console.group("🔍 팔로우 상태 확인");
        console.log("프로필 사용자:", user.name, `(${user.id})`);
        
        // 현재 사용자의 Supabase user_id 조회
        const { data: currentUserData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerkUserId)
          .single();

        if (userError || !currentUserData) {
          console.error("현재 사용자 정보 조회 실패:", userError);
          setIsLoading(false);
          return;
        }

        console.log("현재 사용자 ID:", currentUserData.id);

        // 팔로우 관계 확인 (maybeSingle 사용: 관계가 없어도 에러 발생 안 함)
        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserData.id)
          .eq("following_id", user.id)
          .maybeSingle();

        if (followError && followError.code !== "PGRST116") {
          // PGRST116은 "no rows returned" 에러 (정상)
          console.error("팔로우 상태 확인 오류:", followError);
        }

        const following = !!followData;
        setIsFollowing(following);
        console.log("팔로우 상태:", following ? "팔로우 중" : "미팔로우");
        console.groupEnd();
      } catch (error) {
        console.error("팔로우 상태 확인 예외:", error);
        setIsFollowing(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [isLoaded, clerkUserId, isOwnProfile, supabase, user.id]);

  /**
   * 팔로우/언팔로우 토글
   */
  const handleToggleFollow = async () => {
    // 유효성 검사
    if (!isLoaded || !clerkUserId) {
      // 로그인이 필요합니다
      alert("로그인이 필요합니다.");
      return;
    }
    
    if (isOwnProfile || isToggling || isLoading) {
      console.warn("팔로우 토글 불가:", {
        isLoaded,
        clerkUserId: !!clerkUserId,
        isOwnProfile,
        isToggling,
        isLoading,
      });
      return;
    }

    const wasFollowing = isFollowing;
    const previousFollowersCount = stats.followers_count;
    const action = wasFollowing ? "언팔로우" : "팔로우";

    // 낙관적 업데이트 (Optimistic Update) - 즉시 UI 반영
    setIsFollowing(!wasFollowing);
    setStats((prev) => ({
      ...prev,
      followers_count: wasFollowing 
        ? Math.max(0, previousFollowersCount - 1) // 음수 방지
        : previousFollowersCount + 1,
    }));
    setIsToggling(true);

    try {
      console.group(`👥 ${action} 시작`);
      console.log("프로필 사용자:", user.name, `(${user.clerk_id})`);

      const response = await fetch("/api/follows", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          following_id: user.clerk_id,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 특수 케이스: 이미 팔로우 중인 경우 (409)는 실제로는 성공으로 처리
        if (response.status === 409 && !wasFollowing) {
          console.log("✅ 이미 팔로우 중 (성공 처리)");
          setIsFollowing(true);
          setStats((prev) => ({
            ...prev,
            followers_count: previousFollowersCount + 1,
          }));
          console.groupEnd();
          return;
        }

        // 일반 에러 처리
        const errorMessage = responseData.error || "팔로우 처리 실패";
        console.error(`❌ ${action} 실패:`, errorMessage);
        throw new Error(errorMessage);
      }

      // 성공 처리
      console.log(`✅ ${action} 성공`);
      console.groupEnd();
    } catch (error) {
      console.error(`❌ ${action} 오류:`, error);
      
      // 실패 시 롤백 (낙관적 업데이트 되돌리기)
      setIsFollowing(wasFollowing);
      setStats((prev) => ({
        ...prev,
        followers_count: previousFollowersCount,
      }));
      
      // 사용자에게 에러 알림 (alert 대신 더 나은 방법 고려 가능)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "팔로우 처리에 실패했습니다. 다시 시도해주세요.";
      
      alert(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-[var(--instagram-card-background)] mb-6 w-full">
      {/* 모바일 레이아웃: 프로필 이미지 + 사용자명 + 통계 */}
      <div className="md:hidden">
        {/* 상단: 프로필 이미지와 통계를 나란히 */}
        <div className="flex items-center gap-4 sm:gap-6 px-4 py-4">
          {/* 프로필 이미지 - 반응형 크기 */}
          <div className="flex-shrink-0">
            <div className="w-[77px] h-[77px] sm:w-[90px] sm:h-[90px] rounded-full bg-[var(--instagram-background)] flex items-center justify-center overflow-hidden border border-[var(--instagram-border)] transition-all duration-300">
              <span className="text-3xl sm:text-4xl text-[var(--text-secondary)] font-instagram-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* 통계 (모바일) */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="font-instagram-semibold text-[var(--text-primary)]">
                {stats.posts_count.toLocaleString()}
              </div>
              <div className="text-[var(--text-secondary)] text-xs">게시물</div>
            </div>
            <button className="text-center">
              <div className="font-instagram-semibold text-[var(--text-primary)]">
                {stats.followers_count.toLocaleString()}
              </div>
              <div className="text-[var(--text-secondary)] text-xs">팔로워</div>
            </button>
            <button className="text-center">
              <div className="font-instagram-semibold text-[var(--text-primary)]">
                {stats.following_count.toLocaleString()}
              </div>
              <div className="text-[var(--text-secondary)] text-xs">팔로잉</div>
            </button>
          </div>
        </div>

        {/* 풀네임 및 바이오 (모바일) */}
        <div className="px-4 pb-4 space-y-1">
          {fullName && (
            <p className="font-instagram-semibold text-[var(--text-primary)] text-sm">
              {fullName}
            </p>
          )}
          {bio && (
            <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap">
              {bio}
            </p>
          )}
          {!fullName && !bio && (
            <p className="font-instagram-semibold text-[var(--text-primary)] text-sm">
              {user.name}
            </p>
          )}
        </div>

        {/* 액션 버튼들 (모바일) */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {isOwnProfile ? (
              <>
                <button className="flex-1 px-4 py-1.5 bg-[var(--instagram-background)] rounded-lg text-[var(--text-primary)] font-instagram-semibold text-sm hover:bg-[var(--instagram-border)] transition-colors">
                  프로필 편집
                </button>
                <button className="flex-1 px-4 py-1.5 bg-[var(--instagram-background)] rounded-lg text-[var(--text-primary)] font-instagram-semibold text-sm hover:bg-[var(--instagram-border)] transition-colors">
                  보관함 보기
                </button>
              </>
            ) : (
              <>
                {/* 팔로우 버튼 - Instagram 스타일: 항상 표시, 로그인 상태에 따라 동작 */}
                <button
                  onClick={handleToggleFollow}
                  disabled={isToggling}
                  className={`
                    flex-1 px-4 py-1.5 rounded-lg font-instagram-semibold text-sm
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isFollowing
                        ? "bg-[var(--instagram-background)] text-[var(--text-primary)] hover:bg-[var(--instagram-border)]"
                        : "bg-[var(--instagram-blue)] text-white hover:bg-[#1877f2]"
                    }
                    ${isLoading ? "opacity-70" : ""}
                  `}
                >
                  {isToggling 
                    ? "처리 중..." 
                    : isLoading 
                      ? "로딩 중..." 
                      : isFollowing 
                        ? "팔로잉" 
                        : "팔로우"}
                </button>
                <button 
                  className="flex-1 px-4 py-1.5 bg-[var(--instagram-background)] rounded-lg text-[var(--text-primary)] font-instagram-semibold text-sm hover:bg-[var(--instagram-border)] transition-colors"
                  disabled
                  title="준비 중"
                >
                  메시지
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex gap-7 lg:gap-12 xl:gap-20 2xl:gap-28 py-8 items-start">
        {/* 프로필 이미지 - 화면 크기에 따라 확장 */}
        <div className="flex-shrink-0 flex justify-center items-center">
          <div className="w-[150px] h-[150px] md:w-[168px] md:h-[168px] lg:w-[190px] lg:h-[190px] xl:w-[230px] xl:h-[230px] 2xl:w-[270px] 2xl:h-[270px] rounded-full bg-[var(--instagram-background)] flex items-center justify-center overflow-hidden border border-[var(--instagram-border)] transition-all duration-300">
            {/* TODO: 실제 프로필 이미지 URL 사용 (프로필 이미지 업로드 기능 구현 후) */}
            <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl text-[var(--text-secondary)] font-instagram-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* 첫 번째 줄: 사용자명 및 액션 버튼 */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
            {/* 사용자명 */}
            <h1 className="text-xl md:text-2xl font-instagram-normal text-[var(--text-primary)] text-center md:text-left">
              {user.name}
            </h1>

            {/* 액션 버튼들 */}
            <div className="flex justify-center md:justify-start items-center gap-2">
              {isOwnProfile ? (
                <>
                  {/* 본인 프로필: 프로필 편집 + 보관함 보기 + 설정 */}
                  <button 
                    className="px-4 py-1.5 bg-[var(--instagram-background)] border-0 rounded-lg text-[var(--text-primary)] font-instagram-semibold text-instagram-sm hover:bg-[var(--instagram-border)] transition-colors"
                    title="프로필 편집"
                  >
                    프로필 편집
                  </button>
                  <button 
                    className="px-4 py-1.5 bg-[var(--instagram-background)] border-0 rounded-lg text-[var(--text-primary)] font-instagram-semibold text-instagram-sm hover:bg-[var(--instagram-border)] transition-colors"
                    title="보관함 보기"
                  >
                    보관함 보기
                  </button>
                  <button 
                    className="w-9 h-9 flex items-center justify-center bg-[var(--instagram-background)] border-0 rounded-lg text-[var(--text-primary)] hover:bg-[var(--instagram-border)] transition-colors"
                    title="설정"
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  {/* 다른 사람 프로필: 팔로우 + 메시지 + 더보기 - Instagram 스타일 */}
                  <button
                    onClick={handleToggleFollow}
                    disabled={isToggling}
                    className={`
                      group relative px-4 py-1.5 rounded-lg font-instagram-semibold text-instagram-sm min-w-[90px]
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        isFollowing
                          ? // 팔로우 중: 회색 배경, hover 시 "언팔로우" 표시
                            "bg-[var(--instagram-background)] border-0 text-[var(--text-primary)] hover:bg-[var(--instagram-border)]"
                          : // 미팔로우: 파란색 배경
                            "bg-[var(--instagram-blue)] text-white hover:bg-[#1877f2] border-0"
                      }
                      ${isLoading ? "opacity-70" : ""}
                    `}
                    title={isFollowing ? "언팔로우" : "팔로우"}
                  >
                    {isToggling ? (
                      <span className="opacity-70">처리 중...</span>
                    ) : isLoading ? (
                      <span className="opacity-70">로딩 중...</span>
                    ) : isFollowing ? (
                      <>
                        {/* Instagram 스타일: hover 시 "언팔로우"로 변경 */}
                        <span className="group-hover:hidden inline-block">팔로잉</span>
                        <span className="hidden group-hover:inline-block">언팔로우</span>
                      </>
                    ) : (
                      <span>팔로우</span>
                    )}
                  </button>
                  <button 
                    className="px-4 py-1.5 bg-[var(--instagram-background)] border-0 rounded-lg text-[var(--text-primary)] font-instagram-semibold text-instagram-sm hover:bg-[var(--instagram-border)] transition-colors"
                    disabled
                    title="준비 중"
                  >
                    메시지
                  </button>
                  <button 
                    className="w-9 h-9 flex items-center justify-center bg-[var(--instagram-background)] border-0 rounded-lg text-[var(--text-primary)] hover:bg-[var(--instagram-border)] transition-colors"
                    title="더보기"
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="6" cy="12" r="1.5" />
                      <circle cx="18" cy="12" r="1.5" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 두 번째 줄: 통계 정보 (데스크톱) */}
          <div className="hidden md:flex gap-10">
            <div>
              <span className="font-instagram-semibold text-[var(--text-primary)]">
                {stats.posts_count.toLocaleString()}
              </span>
              <span className="text-[var(--text-primary)] ml-1">게시물</span>
            </div>
            <button className="hover:opacity-60 transition-opacity">
              <span className="font-instagram-semibold text-[var(--text-primary)]">
                {stats.followers_count.toLocaleString()}
              </span>
              <span className="text-[var(--text-primary)] ml-1">팔로워</span>
            </button>
            <button className="hover:opacity-60 transition-opacity">
              <span className="font-instagram-semibold text-[var(--text-primary)]">
                {stats.following_count.toLocaleString()}
              </span>
              <span className="text-[var(--text-primary)] ml-1">팔로잉</span>
            </button>
          </div>

          {/* 세 번째 줄: 풀네임 및 바이오 (데스크톱) */}
          <div className="hidden md:block space-y-1">
            {fullName && (
              <p className="font-instagram-semibold text-[var(--text-primary)] text-instagram-sm">
                {fullName}
              </p>
            )}
            {bio && (
              <p className="text-[var(--text-primary)] text-instagram-sm whitespace-pre-wrap">
                {bio}
              </p>
            )}
            {!fullName && !bio && (
              <p className="font-instagram-semibold text-[var(--text-primary)] text-instagram-sm">
                {user.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

