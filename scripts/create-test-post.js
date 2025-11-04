/**
 * 테스트 게시물 생성 스크립트
 * Supabase에 테스트 게시물을 생성합니다.
 */

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestPost() {
  try {
    console.log('테스트 게시물 생성을 시작합니다...');

    // 1. 기존 사용자 확인 또는 생성
    let { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('사용자 조회 오류:', userError);
      return;
    }

    let userId;
    if (!users || users.length === 0) {
      // 테스트 사용자 생성
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          clerk_id: 'test_user_' + Date.now(),
          name: '테스트 사용자'
        })
        .select()
        .single();

      if (createUserError) {
        console.error('테스트 사용자 생성 오류:', createUserError);
        return;
      }

      userId = newUser.id;
      console.log('테스트 사용자 생성됨:', userId);
    } else {
      userId = users[0].id;
      console.log('기존 사용자 사용:', userId);
    }

    // 2. 테스트 이미지 URL 생성 (실제로는 Supabase Storage에 업로드해야 함)
    // 임시로 더미 이미지 URL 사용
    const testImageUrl = 'https://via.placeholder.com/600x600/0095f6/ffffff?text=Test+Post';

    // 3. 게시물 생성
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        image_url: testImageUrl,
        caption: '테스트 게시물입니다! 프로필 페이지에서 이 게시물을 확인해보세요.'
      })
      .select()
      .single();

    if (postError) {
      console.error('게시물 생성 오류:', postError);
      return;
    }

    console.log('테스트 게시물 생성 완료!');
    console.log('게시물 ID:', post.id);
    console.log('사용자 ID:', userId);
    console.log('이미지 URL:', testImageUrl);

    // 4. 게시물 수 확인
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log('사용자의 총 게시물 수:', postCount);

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 스크립트 실행
createTestPost();
