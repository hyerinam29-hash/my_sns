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
 * 
 * @dependencies
 * - Tailwind CSS: 스타일링
 * - Instagram 컬러 스키마: 디자인 시스템
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
  stats,
  isOwnProfile,
  fullName,
  bio,
}: ProfileHeaderProps) {
  console.group("📋 ProfileHeader 렌더링");
  console.log("사용자:", user.name);
  console.log("본인 프로필:", isOwnProfile);
  console.log("통계:", stats);
  console.groupEnd();

  return (
    <div className="bg-[var(--card-background)] border border-[var(--border)] rounded-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[var(--border)]">
            {/* TODO: 실제 프로필 이미지 URL 사용 (프로필 이미지 업로드 기능 구현 후) */}
            <span className="text-4xl md:text-6xl text-gray-400 font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 space-y-4">
          {/* 사용자명 및 액션 버튼 */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] text-center md:text-left">
              {user.name}
            </h1>

            {/* 본인 프로필 vs 다른 사람 프로필 구분 */}
            <div className="flex justify-center md:justify-start gap-2">
              {isOwnProfile ? (
                <button className="px-4 py-2 bg-[var(--card-background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] font-semibold hover:bg-gray-50 transition-colors">
                  프로필 편집
                </button>
              ) : (
                <>
                  <button className="px-4 py-2 bg-[var(--instagram-blue)] text-white rounded-md font-semibold hover:bg-[#0084d4] transition-colors">
                    팔로우
                  </button>
                  <button className="px-4 py-2 bg-[var(--card-background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] font-semibold hover:bg-gray-50 transition-colors">
                    메시지
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="flex gap-6 justify-center md:justify-start">
            <div className="text-center md:text-left">
              <span className="font-semibold text-[var(--text-primary)]">
                {stats.posts_count}
              </span>
              <span className="text-[var(--text-secondary)] ml-1">게시물</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold text-[var(--text-primary)]">
                {stats.followers_count}
              </span>
              <span className="text-[var(--text-secondary)] ml-1">팔로워</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold text-[var(--text-primary)]">
                {stats.following_count}
              </span>
              <span className="text-[var(--text-secondary)] ml-1">팔로잉</span>
            </div>
          </div>

          {/* 풀네임 및 바이오 */}
          <div className="space-y-1">
            {fullName && (
              <p className="font-semibold text-[var(--text-primary)] text-center md:text-left">
                {fullName}
              </p>
            )}
            {bio && (
              <p className="text-[var(--text-primary)] text-center md:text-left whitespace-pre-wrap">
                {bio}
              </p>
            )}
            {/* 풀네임이나 바이오가 없는 경우 기본으로 사용자명 표시 */}
            {!fullName && !bio && (
              <p className="font-semibold text-[var(--text-primary)] text-center md:text-left">
                {user.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

