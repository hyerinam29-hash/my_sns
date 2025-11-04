/**
 * 게시물 상세 페이지 (모바일용)
 * 
 * @param params - postId: 게시물 ID (UUID)
 * 
 * TODO: 게시물 상세 컴포넌트 구현 예정
 * - PostCard
 * - CommentList
 * - CommentForm
 */
export default function PostDetailPage({
  params,
}: {
  params: { postId: string };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* TODO: 뒤로가기 버튼 추가 */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          게시물 상세
        </h1>
      </div>
      <p className="text-[var(--text-secondary)]">
        게시물 ID: {params.postId}
      </p>
      {/* TODO: PostCard 컴포넌트 추가 */}
      {/* TODO: CommentList 컴포넌트 추가 */}
      {/* TODO: CommentForm 컴포넌트 추가 */}
    </div>
  );
}

