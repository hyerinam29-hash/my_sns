import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 테스트 게시물 생성 API
 * 개발용으로 테스트 게시물을 생성합니다.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("환경 변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log("테스트 게시물 생성을 시작합니다...");

    // 쿼리 파라미터에서 생성할 게시물 개수와 리셋 옵션 확인
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get("count") || "1", 10);
    const shouldReset = searchParams.get("reset") === "true";

    // 1. 기존 사용자 확인 또는 생성
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('사용자 조회 오류:', userError);
      return NextResponse.json(
        { error: "사용자 조회 실패", details: userError.message },
        { status: 500 }
      );
    }

    let userId;
    let userName;

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
        return NextResponse.json(
          { error: "테스트 사용자 생성 실패", details: createUserError.message },
          { status: 500 }
        );
      }

      userId = newUser.id;
      userName = newUser.name;
      console.log('테스트 사용자 생성됨:', userId);
    } else {
      userId = users[0].id;
      userName = users[0].name;
      console.log('기존 사용자 사용:', userId);
    }

    // 1.5. 리셋 옵션이 true일 때 기존 게시물 삭제
    if (shouldReset) {
      console.log('기존 게시물들을 삭제합니다...');
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('기존 게시물 삭제 오류:', deleteError);
        return NextResponse.json(
          { error: "기존 게시물 삭제 실패", details: deleteError.message },
          { status: 500 }
        );
      }
      console.log('기존 게시물들이 삭제되었습니다.');
    }

    // 2. 테스트 이미지 URL 및 캡션 준비 (더 신뢰할 수 있는 이미지 서비스 사용)
    const testPosts = [
      {
        image_url: 'https://picsum.photos/600/600?random=1',
        caption: '첫 번째 테스트 게시물입니다! 🎉'
      },
      {
        image_url: 'https://picsum.photos/600/600?random=2',
        caption: '두 번째 테스트 게시물입니다! ❤️'
      },
      {
        image_url: 'https://picsum.photos/600/600?random=3',
        caption: '세 번째 테스트 게시물입니다! 🌟'
      },
      {
        image_url: 'https://picsum.photos/600/600?random=4',
        caption: '네 번째 테스트 게시물입니다! 🚀'
      },
      {
        image_url: 'https://picsum.photos/600/600?random=5',
        caption: '다섯 번째 테스트 게시물입니다! ✨'
      }
    ];

    // 요청된 개수만큼 게시물 생성 (최대 5개)
    const postsToCreate = Math.min(count, testPosts.length);
    const createdPosts = [];

    for (let i = 0; i < postsToCreate; i++) {
      const testPost = testPosts[i];

      // 3. 게시물 생성
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          image_url: testPost.image_url,
          caption: testPost.caption
        })
        .select()
        .single();

      if (postError) {
        console.error(`게시물 ${i + 1} 생성 오류:`, postError);
        continue; // 오류가 발생해도 다음 게시물 계속 생성
      }

      console.log(`게시물 ${i + 1} 생성 완료:`, post.id);
      createdPosts.push({
        post_id: post.id,
        image_url: testPost.image_url,
        caption: testPost.caption
      });
    }

    // 4. 게시물 수 확인
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log('사용자의 총 게시물 수:', postCount);

    return NextResponse.json({
      success: true,
      message: `${createdPosts.length}개의 테스트 게시물이 생성되었습니다.`,
      data: {
        user_id: userId,
        user_name: userName,
        created_posts: createdPosts,
        total_posts: postCount
      }
    });

  } catch (error) {
    console.error('테스트 게시물 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: "서버 오류", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
