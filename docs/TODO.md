# SNS 인스타그램 프로젝트 TODO

> PRD.MD를 참고하여 단계별로 구현 진행

---

## 1단계: 기본 세팅 및 환경 구성

### 프로젝트 설정
- [x] Next.js + TypeScript 프로젝트 생성
- [x] Tailwind CSS 설정
- [x] Clerk 인증 연동 (한국어 설정)
- [x] Supabase 프로젝트 생성 및 연동
- [x] Tailwind CSS 인스타 컬러 스키마 설정
  - [x] Instagram Blue (#0095f6)
  - [x] Background (#fafafa)
  - [x] Card Background (#ffffff)
  - [x] Border (#dbdbdb)
  - [x] Text Primary (#262626) / Secondary (#8e8e8e)
  - [x] Like Red (#ed4956)
- [x] 타이포그래피 설정
  - [x] 폰트 패밀리 (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
  - [x] 텍스트 크기 (xs: 12px, sm: 14px, base: 16px, xl: 20px)
  - [x] 폰트 굵기 (normal: 400, semibold: 600, bold: 700)

### 데이터베이스 스키마
- [x] users 테이블 (Clerk 동기화)
- [x] posts 테이블 생성
  - [x] id, user_id, image_url, caption, created_at
  - [x] 외래키 제약조건 (users 참조)
  - [x] 인덱스 생성 (user_id, created_at)
- [x] likes 테이블 생성
  - [x] id, user_id, post_id, created_at
  - [x] 외래키 제약조건 (users, posts 참조)
  - [x] 중복 방지 제약조건 (UNIQUE)
  - [x] 인덱스 생성 (user_id, post_id)
- [x] comments 테이블 생성
  - [x] id, user_id, post_id, content, created_at
  - [x] 외래키 제약조건 (users, posts 참조)
  - [x] 인덱스 생성 (user_id, post_id, created_at)
- [x] follows 테이블 생성
  - [x] id, follower_id, following_id, created_at
  - [x] 외래키 제약조건 (users 참조)
  - [x] 중복 방지 및 자기 자신 팔로우 방지 제약조건
  - [x] 인덱스 생성 (follower_id, following_id)

### Supabase Storage
- [x] uploads 버킷 생성
- [x] posts 버킷 생성
  - [x] Public 버킷으로 생성 (모든 사용자 조회 가능)
  - [x] 파일 크기 제한: 5MB
  - [x] 허용 파일 타입: 이미지 파일만 (jpeg, jpg, png, webp, gif)
  - [x] 경로 구조: `posts/{user_id}/{timestamp}_{filename}`

---

## 2단계: 레이아웃 구조 구현

### Route Group 구조
- [x] `app/(auth)/` 그룹 생성
  - [x] `sign-in/page.tsx` (Clerk 기본 사용)
  - [x] `sign-up/page.tsx` (Clerk 기본 사용)
- [x] `app/(main)/` 그룹 생성
  - [x] `layout.tsx` (기본 레이아웃 - Sidebar는 다음 단계에서 구현)
  - [x] `page.tsx` (홈 피드)
  - [x] `profile/[userId]/page.tsx` (프로필 페이지)
  - [x] `post/[postId]/page.tsx` (게시물 상세 - 모바일용)

### 레이아웃 컴포넌트
- [x] `components/layout/Sidebar.tsx`
  - [x] Desktop (244px) - 아이콘 + 텍스트
  - [x] Tablet (72px) - 아이콘만
  - [x] 메뉴: 홈, 검색, 만들기, 프로필
  - [x] Hover 효과, Active 상태 스타일
  - [x] 반응형 레이아웃 (Desktop/Tablet/Mobile)
  - [x] `app/(main)/layout.tsx`에 통합
- [x] `components/layout/Header.tsx`
  - [x] Mobile 전용 (60px 높이)
  - [x] 로고 + 알림/DM/프로필 아이콘
  - [x] Instagram 스타일 적용
- [x] `components/layout/BottomNav.tsx`
  - [x] Mobile 전용 (50px 높이)
  - [x] 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
  - [x] Active 상태 스타일
- [x] 반응형 레이아웃 통합
  - [x] Desktop: Sidebar (244px) + Main Feed
  - [x] Tablet: Icon Sidebar (72px) + Main Feed
  - [x] Mobile: Header (60px) + Main Feed + BottomNav (50px)
  - [x] `app/(main)/layout.tsx`에 모든 컴포넌트 통합

---

## 3단계: 홈 피드 구현

### PostCard 컴포넌트
- [x] `components/post/PostCard.tsx` 기본 구조
  - [x] Header (60px)
    - [x] 프로필 이미지 (32px 원형)
    - [x] 사용자명 (Bold)
    - [x] 시간 표시 (작고 회색, 상대 시간 표시)
    - [x] ⋯ 메뉴 버튼 (우측)
    - [x] 타입 정의 (PostCardProps)
    - [x] Instagram 스타일 적용
  - [x] Image 영역
    - [x] 1:1 정사각형 비율 (aspect-square)
    - [x] Next.js Image 컴포넌트 사용
    - [x] 더블탭 좋아요 이벤트 (모바일)
    - [x] 더블탭 시 큰 하트 애니메이션 (fade in/out)
  - [x] Actions 영역 (48px)
    - [x] ❤️ 좋아요 버튼 (좌)
      - [x] 빈 하트 ↔ 빨간 하트 상태 전환
      - [x] 클릭 애니메이션 (scale 1.3 → 1)
      - [x] 상태 관리 (useState)
    - [x] 💬 댓글 버튼 (좌)
    - [x] ✈️ 공유 버튼 (좌, UI만, disabled)
    - [x] 🔖 북마크 버튼 (우, UI만, disabled)
  - [x] Content 영역
    - [x] 좋아요 수 표시 (Bold)
    - [x] 캡션 표시 (사용자명 Bold + 내용)
    - [x] "... 더 보기" 토글 (2줄 초과 시)
    - [x] 댓글 미리보기 (최신 2개)

### 로딩 UI
- [x] `components/post/PostCardSkeleton.tsx`
  - [x] Skeleton UI (회색 박스 애니메이션)
  - [x] Shimmer 효과

### 피드 컴포넌트
- [x] `components/post/PostFeed.tsx`
  - [x] PostCard 리스트 렌더링
  - [x] 무한 스크롤 구현 (Intersection Observer)
  - [x] 페이지네이션 (10개씩 로드)

### API 라우트
- [x] `app/api/posts/route.ts`
  - [x] GET: 게시물 목록 조회
    - [x] 페이지네이션 (limit, offset)
    - [x] 시간 역순 정렬
    - [x] 사용자 정보 JOIN
    - [x] 좋아요 수, 댓글 수 집계
  - [ ] POST: 게시물 생성 (5단계에서 구현)

---

## 4단계: 좋아요 기능 구현

### 데이터베이스
- [x] likes 테이블 마이그레이션
- [x] 인덱스 설정 (user_id, post_id)

### API 라우트
- [ ] `app/api/likes/route.ts`
  - [ ] POST: 좋아요 추가
  - [ ] DELETE: 좋아요 취소
  - [ ] 인증 검증 (Clerk user ID)

### UI 구현
- [ ] PostCard 좋아요 버튼 연동
  - [ ] 빈 하트 ↔ 빨간 하트 상태
  - [ ] 클릭 애니메이션 (scale 1.3 → 1)
  - [ ] 실시간 좋아요 수 업데이트
- [ ] 더블탭 좋아요 (모바일)
  - [ ] 이미지 더블탭 이벤트
  - [ ] 큰 하트 등장 애니메이션 (fade in/out)
  - [ ] 좋아요 상태 업데이트

---

## 5단계: 게시물 작성 기능

### 모달 컴포넌트
- [ ] `components/post/CreatePostModal.tsx`
  - [ ] Dialog 기반 모달
  - [ ] 이미지 업로드 영역
    - [ ] 드래그 앤 드롭
    - [ ] 파일 선택 버튼
    - [ ] 이미지 미리보기 (1:1 비율)
  - [ ] 캡션 입력 필드
    - [ ] 최대 2,200자 제한
    - [ ] 글자 수 표시
  - [ ] "공유하기" 버튼
  - [ ] 로딩 상태 처리

### 이미지 업로드
- [ ] Supabase Storage 업로드 로직
  - [ ] 파일 검증 (이미지, 최대 5MB)
  - [ ] 이미지 최적화 (선택사항)
  - [ ] 경로: `posts/{user_id}/{timestamp}_{filename}`
- [ ] 업로드 진행률 표시

### API 라우트
- [ ] `app/api/posts/route.ts` POST 구현
  - [ ] 이미지 업로드
  - [ ] posts 테이블에 레코드 생성
  - [ ] 인증 검증

### UI 연동
- [ ] Sidebar "만들기" 버튼 클릭 → 모달 열기
- [ ] 게시물 작성 후 피드 새로고침
- [ ] 에러 핸들링 및 토스트 메시지

---

## 6단계: 댓글 기능

### 데이터베이스
- [ ] comments 테이블 마이그레이션
- [ ] 인덱스 설정 (post_id, created_at)

### 컴포넌트
- [ ] `components/comment/CommentList.tsx`
  - [ ] 댓글 목록 렌더링
  - [ ] 스크롤 가능한 영역
  - [ ] 최신순 정렬
  - [ ] 삭제 버튼 (본인만 표시)
- [ ] `components/comment/CommentForm.tsx`
  - [ ] 댓글 입력 필드 ("댓글 달기...")
  - [ ] Enter 키 또는 "게시" 버튼
  - [ ] 입력 상태 관리

### API 라우트
- [ ] `app/api/comments/route.ts`
  - [ ] GET: 댓글 목록 조회 (post_id 기준)
  - [ ] POST: 댓글 작성
  - [ ] DELETE: 댓글 삭제 (본인만)
  - [ ] 인증 검증

### UI 연동
- [ ] PostCard에 댓글 미리보기 (최신 2개)
- [ ] 댓글 버튼 클릭 → 상세 모달/페이지 열기
- [ ] 댓글 작성 후 실시간 업데이트
- [ ] 댓글 삭제 기능

---

## 7단계: 게시물 상세 모달/페이지

### 모달 컴포넌트 (Desktop)
- [ ] `components/post/PostModal.tsx`
  - [ ] Dialog 기반 풀스크린 모달
  - [ ] 좌측: 이미지 (50%)
  - [ ] 우측: 댓글 영역 (50%)
    - [ ] PostCard Header
    - [ ] CommentList (스크롤)
    - [ ] Actions (좋아요, 댓글)
    - [ ] 좋아요 수, 캡션
    - [ ] CommentForm
  - [ ] 닫기 버튼 (✕)

### 페이지 (Mobile)
- [ ] `app/(main)/post/[postId]/page.tsx`
  - [ ] 전체 페이지 레이아웃
  - [ ] PostCard + CommentList + CommentForm
  - [ ] 뒤로가기 버튼

### 게시물 삭제
- [ ] PostCard ⋯ 메뉴
  - [ ] 드롭다운 메뉴
  - [ ] "삭제" 옵션 (본인 게시물만)
- [ ] 삭제 확인 다이얼로그
- [ ] `app/api/posts/[postId]/route.ts` DELETE 구현
- [ ] 삭제 후 피드 업데이트

---

## 8단계: 프로필 페이지

### 동적 라우트
- [ ] `app/(main)/profile/[userId]/page.tsx`
  - [ ] 사용자 ID 기반 프로필 조회
  - [ ] 본인 프로필 vs 다른 사람 프로필 구분

### 프로필 헤더
- [ ] `components/profile/ProfileHeader.tsx`
  - [ ] 프로필 이미지 (150px Desktop / 90px Mobile)
  - [ ] 사용자명
  - [ ] 통계: 게시물 수, 팔로워, 팔로잉
  - [ ] "프로필 편집" 또는 "팔로우"/"팔로잉" 버튼
  - [ ] 풀네임 및 바이오

### 게시물 그리드
- [ ] `components/profile/PostGrid.tsx`
  - [ ] 3열 그리드 레이아웃 (반응형)
  - [ ] 1:1 정사각형 썸네일
  - [ ] Hover 시 좋아요/댓글 수 표시
  - [ ] 클릭 시 상세 모달/페이지 열기

### API 라우트
- [ ] `app/api/users/[userId]/route.ts`
  - [ ] GET: 사용자 정보 조회
    - [ ] 게시물 수, 팔로워 수, 팔로잉 수
    - [ ] 사용자 기본 정보
- [ ] `app/api/posts/route.ts` 수정
  - [ ] userId 쿼리 파라미터 추가
  - [ ] 특정 사용자 게시물만 필터링

---

## 9단계: 팔로우 기능

### 데이터베이스
- [ ] follows 테이블 마이그레이션
- [ ] 중복 방지 제약조건
- [ ] 인덱스 설정

### API 라우트
- [ ] `app/api/follows/route.ts`
  - [ ] POST: 팔로우 추가
  - [ ] DELETE: 언팔로우
  - [ ] 인증 검증
  - [ ] 자기 자신 팔로우 방지

### UI 구현
- [ ] ProfileHeader 팔로우 버튼
  - [ ] 미팔로우: "팔로우" (파란색 버튼)
  - [ ] 팔로우 중: "팔로잉" (회색 버튼)
  - [ ] Hover: "언팔로우" (빨간 테두리)
- [ ] 클릭 시 즉시 API 호출
- [ ] 팔로워/팔로잉 수 실시간 업데이트
- [ ] 로딩 상태 처리

---

## 10단계: 무한 스크롤 및 최적화

### 무한 스크롤
- [ ] PostFeed 컴포넌트
  - [ ] Intersection Observer 구현
  - [ ] 하단 도달 시 자동 로드
  - [ ] 로딩 인디케이터
- [ ] 페이지네이션 상태 관리
  - [ ] offset/cursor 기반
  - [ ] 중복 로드 방지

### 성능 최적화
- [ ] 이미지 lazy loading
- [ ] React.memo 적용 (필요한 컴포넌트)
- [ ] 이미지 최적화 (Next.js Image 컴포넌트)

---

## 11단계: 반응형 및 최종 마무리

### 반응형 테스트
- [ ] Desktop (1024px+) 테스트
- [ ] Tablet (768px ~ 1023px) 테스트
- [ ] Mobile (< 768px) 테스트
- [ ] 다양한 화면 크기에서 레이아웃 확인

### 에러 핸들링
- [ ] API 에러 처리
- [ ] 네트워크 에러 처리
- [ ] 사용자 친화적 에러 메시지
- [ ] 토스트 알림 (선택사항)

### UI/UX 개선
- [ ] 로딩 상태 일관성
- [ ] Skeleton UI 모든 페이지 적용
- [ ] 애니메이션 부드럽게
- [ ] 접근성 개선 (ARIA 라벨 등)

---

## 12단계: 배포 및 문서화

### 배포 준비
- [ ] 환경 변수 설정 (Vercel)
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] Clerk 키들
- [ ] Supabase 프로덕션 설정
  - [ ] RLS 정책 검토 (필요시)
  - [ ] Storage 버킷 권한 확인

### Vercel 배포
- [ ] GitHub 연동
- [ ] 빌드 설정 확인
- [ ] 프로덕션 배포
- [ ] 도메인 설정 (선택사항)

### 문서화
- [ ] README.md 업데이트
- [ ] API 문서 작성 (선택사항)
- [ ] 환경 설정 가이드

---

## 향후 확장 기능 (2차 MVP)

- [ ] 검색 기능 (사용자, 해시태그)
- [ ] 탐색 페이지
- [ ] 릴스
- [ ] 메시지 (DM)
- [ ] 알림
- [ ] 스토리
- [ ] 동영상 지원
- [ ] 이미지 여러 장 (카루셀)
- [ ] 공유 버튼 기능
- [ ] 북마크 기능
- [ ] 프로필 편집
- [ ] 팔로워/팔로잉 목록 모달

---

**마지막 업데이트**: 2025-01-XX  
**참고 문서**: [PRD.MD](./PRD.MD)
