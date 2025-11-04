/**
 * 홈 피드 페이지
 * 
 * PostFeed 컴포넌트를 사용하여 게시물 목록을 표시합니다.
 * - 게시물 목록 표시
 * - 무한 스크롤
 * - 페이지네이션 (10개씩 로드)
 */
import PostFeed from "@/components/post/PostFeed";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <PostFeed />
    </div>
  );
}

