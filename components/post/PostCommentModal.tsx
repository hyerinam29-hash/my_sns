"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CommentList, { Comment } from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";

/**
 * PostCommentModal 컴포넌트
 * 
 * 게시물 댓글 상세 모달
 * 
 * 주요 기능:
 * 1. 댓글 목록 표시 (CommentList)
 * 2. 댓글 작성 (CommentForm)
 * 3. 댓글 삭제
 * 4. 실시간 업데이트
 * 
 * @param postId - 게시물 ID
 * @param open - 모달 열림 상태
 * @param onOpenChange - 모달 상태 변경 핸들러
 * @param onCommentUpdate - 댓글 업데이트 콜백 (댓글 수 변경 시 피드 새로고침)
 */
interface PostCommentModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentUpdate?: () => void;
}

export default function PostCommentModal({
  postId,
  open,
  onOpenChange,
  onCommentUpdate,
}: PostCommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 댓글 목록 불러오기
   */
  const fetchComments = async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      console.group("💬 댓글 목록 불러오기");
      console.log("post_id:", postId);

      const response = await fetch(`/api/comments?post_id=${postId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "댓글을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      console.log("댓글 개수:", data.comments.length);
      console.groupEnd();

      setComments(data.comments || []);
    } catch (error) {
      console.error("댓글 불러오기 오류:", error);
      alert(error instanceof Error ? error.message : "댓글을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 댓글 작성
   */
  const handleAddComment = async (content: string) => {
    if (!postId || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.group("💬 댓글 작성");
      console.log("post_id:", postId);
      console.log("content:", content.substring(0, 50));

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "댓글 작성에 실패했습니다.");
      }

      const data = await response.json();
      console.log("댓글 작성 성공:", data.comment.id);
      console.groupEnd();

      // 댓글 목록 새로고침 (최신 댓글 반영)
      await fetchComments();

      // 피드 업데이트 콜백 호출
      if (onCommentUpdate) {
        onCommentUpdate();
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert(error instanceof Error ? error.message : "댓글 작성에 실패했습니다.");
      throw error; // CommentForm에서 에러 처리 가능하도록
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 댓글 삭제
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!commentId || isSubmitting) return;

    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.group("🗑️ 댓글 삭제");
      console.log("comment_id:", commentId);

      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "댓글 삭제에 실패했습니다.");
      }

      console.log("댓글 삭제 성공");
      console.groupEnd();

      // 댓글 목록에서 제거
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      // 피드 업데이트 콜백 호출
      if (onCommentUpdate) {
        onCommentUpdate();
      }
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달이 열릴 때 댓글 목록 불러오기
  useEffect(() => {
    if (open && postId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-[var(--text-primary)] font-instagram-bold text-instagram-base">
            댓글
          </DialogTitle>
        </DialogHeader>

        {/* 댓글 목록 */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[var(--text-secondary)] text-instagram-sm">
                댓글을 불러오는 중...
              </p>
            </div>
          ) : (
            <CommentList
              comments={comments}
              onDelete={handleDeleteComment}
            />
          )}
        </div>

        {/* 댓글 작성 폼 */}
        <CommentForm
          onSubmit={handleAddComment}
          disabled={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

