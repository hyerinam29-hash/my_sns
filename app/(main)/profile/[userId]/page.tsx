/**
 * 사용자 프로필 페이지
 * 
 * @param params - userId: 사용자 ID (Clerk user ID 또는 UUID)
 * 
 * TODO: 프로필 헤더 및 게시물 그리드 구현 예정
 */
export default function ProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        프로필 페이지
      </h1>
      <p className="text-[var(--text-secondary)]">
        사용자 ID: {params.userId}
      </p>
      {/* TODO: ProfileHeader 컴포넌트 추가 */}
      {/* TODO: PostGrid 컴포넌트 추가 */}
    </div>
  );
}

