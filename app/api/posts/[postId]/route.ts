import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 게시물 상세 API 라우트
 * 
 * DELETE: 게시물 삭제
 * - 인증 검증 (Clerk user ID)
 * - 본인 게시물인지 확인
 * - 게시물 및 관련 데이터 삭제 (좋아요, 댓글)
 * - Supabase Storage에서 이미지 삭제
 */

/**
 * Supabase user_id 조회 헬퍼 함수
 */
async function getSupabaseUserId(clerkUserId: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (userError || !userData) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  return userData.id;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    console.group("🗑️ API: 게시물 삭제");
    
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      console.error("인증되지 않은 사용자");
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // params 파싱 (Next.js 15)
    const resolvedParams = await params;
    const postId = resolvedParams.postId;

    console.log("post_id:", postId);
    console.log("clerk_user_id:", clerkUserId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // Supabase user_id 조회
    const supabaseUserId = await getSupabaseUserId(clerkUserId);

    // 게시물 정보 조회 (작성자 확인)
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      console.error("게시물 조회 오류:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 게시물인지 확인
    if (postData.user_id !== supabaseUserId) {
      console.error("권한 없음 - 본인 게시물이 아님");
      return NextResponse.json(
        { error: "본인의 게시물만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    console.log("게시물 작성자 확인 완료:", postData.user_id);

    // 이미지 URL에서 파일 경로 추출 (Supabase Storage 삭제용)
    // image_url 형식: https://{project}.supabase.co/storage/v1/object/public/posts/{path}
    // 또는: https://{project}.supabase.co/storage/v1/object/public/posts/{user_id}/{filename}
    let imagePath: string | null = null;
    if (postData.image_url) {
      try {
        const url = new URL(postData.image_url);
        // /storage/v1/object/public/posts/{path} 부분 추출
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/posts\/(.+)/);
        if (pathMatch) {
          imagePath = pathMatch[1];
          console.log("이미지 경로 추출:", imagePath);
        }
      } catch (error) {
        console.warn("이미지 URL 파싱 실패 (계속 진행):", error);
      }
    }

    // 관련 데이터 삭제 (좋아요, 댓글)
    // 좋아요 삭제
    const { error: likesError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId);

    if (likesError) {
      console.error("좋아요 삭제 오류:", likesError);
      // 에러가 발생해도 계속 진행 (게시물 삭제는 우선)
    } else {
      console.log("좋아요 삭제 완료");
    }

    // 댓글 삭제
    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .eq("post_id", postId);

    if (commentsError) {
      console.error("댓글 삭제 오류:", commentsError);
      // 에러가 발생해도 계속 진행 (게시물 삭제는 우선)
    } else {
      console.log("댓글 삭제 완료");
    }

    // 게시물 삭제
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("게시물 삭제 오류:", deleteError);
      return NextResponse.json(
        { error: "게시물 삭제에 실패했습니다.", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("게시물 삭제 완료");

    // Supabase Storage에서 이미지 삭제 (선택사항)
    if (imagePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from("posts")
          .remove([imagePath]);

        if (storageError) {
          console.warn("이미지 파일 삭제 실패 (무시):", storageError);
          // 이미지 삭제 실패는 치명적이지 않으므로 계속 진행
        } else {
          console.log("이미지 파일 삭제 완료");
        }
      } catch (error) {
        console.warn("이미지 파일 삭제 중 오류 (무시):", error);
      }
    }

    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "게시물이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

