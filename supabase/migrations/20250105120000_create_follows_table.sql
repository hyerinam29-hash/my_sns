-- ============================================
-- Follows 테이블 마이그레이션
-- ============================================
-- 팔로우 관계를 저장하는 테이블
-- ============================================

-- ============================================
-- Follows 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 중복 팔로우 방지: 같은 사용자가 같은 사용자를 여러 번 팔로우 불가
    UNIQUE(follower_id, following_id),
    
    -- 자기 자신 팔로우 방지: follower_id와 following_id가 같을 수 없음
    CHECK (follower_id != following_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.follows OWNER TO postgres;

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================
-- follower_id 인덱스: 특정 사용자가 팔로우하는 사람 목록 조회용
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);

-- following_id 인덱스: 특정 사용자를 팔로우하는 사람 목록 조회용 (팔로워 목록)
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- ============================================
-- RLS 비활성화 (개발 단계)
-- ============================================
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 권한 부여
-- ============================================
GRANT ALL ON TABLE public.follows TO anon;
GRANT ALL ON TABLE public.follows TO authenticated;
GRANT ALL ON TABLE public.follows TO service_role;

