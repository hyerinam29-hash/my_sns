/**
 * Supabase 연결 테스트 스크립트
 * 
 * 환경 변수가 설정되어 있는지 확인하고,
 * 실제로 Supabase에 연결이 되는지 테스트합니다.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Supabase 연결 상태 확인 중...\n');

// 1. 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 환경 변수 확인:');
console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 설정 안됨'}`);
console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ 설정됨' : '❌ 설정 안됨'}`);
console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ 설정됨' : '❌ 설정 안됨'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다.');
  console.error('   .env 파일을 확인하고 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.');
  process.exit(1);
}

// 2. Supabase 클라이언트 생성 및 연결 테스트
console.log('🔌 Supabase 연결 테스트 중...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase 연결 실패:');
      console.error(`   에러 메시지: ${error.message}`);
      console.error(`   에러 코드: ${error.code || 'N/A'}`);
      console.error(`   에러 힌트: ${error.hint || 'N/A'}\n`);
      
      if (error.code === 'PGRST116') {
        console.error('   💡 힌트: users 테이블이 존재하지 않는 것 같습니다.');
        console.error('      마이그레이션을 실행했는지 확인해주세요.\n');
      }
      
      return false;
    }

    console.log('✅ Supabase 연결 성공!\n');
    
    // 추가 테스트: 테이블 목록 확인
    console.log('📊 데이터베이스 테이블 확인 중...\n');
    
    const tables = ['users', 'posts', 'comments', 'likes', 'follows'];
    const serviceClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    for (const table of tables) {
      try {
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.log(`  ⚠️  ${table}: 존재하지 않거나 접근 권한 없음`);
        } else {
          console.log(`  ✅ ${table}: 존재함 (레코드 수: ${count || 0})`);
        }
      } catch (err) {
        console.log(`  ⚠️  ${table}: 확인 불가`);
      }
    }

    console.log('\n✅ 모든 테스트 완료!');
    return true;
  } catch (error) {
    console.error('❌ 예상치 못한 오류 발생:');
    console.error(error);
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error);
    process.exit(1);
  });

