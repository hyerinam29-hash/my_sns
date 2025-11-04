-- ============================================
-- SNS Instagram Clone - Posts Storage 버킷 생성
-- ============================================
-- 게시물 이미지를 저장하기 위한 posts 버킷 생성
-- 경로 구조: posts/{user_id}/{timestamp}_{filename}
-- ============================================

-- ============================================
-- posts 버킷 생성
-- ============================================
-- 게시물 이미지는 공개적으로 조회 가능하도록 public 버킷으로 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,  -- public bucket (모든 사용자가 조회 가능)
  5242880,  -- 5MB 제한 (5 * 1024 * 1024) - PRD.MD 기준
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[];

