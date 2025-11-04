"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * CommentForm 컴포넌트
 * 
 * 댓글 작성 폼
 * 
 * 주요 기능:
 * 1. 댓글 입력 필드 ("댓글 달기...")
 * 2. Enter 키 또는 "게시" 버튼으로 제출
 * 3. 입력 상태 관리
 * 
 * @param onSubmit - 댓글 제출 핸들러 (content: string) => void
 * @param disabled - 제출 비활성화 여부
 */
interface CommentFormProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
}

export default function CommentForm({
  onSubmit,
  disabled = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedContent);
      setContent(""); // 성공 시 입력 필드 초기화
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 키만 눌렀을 때 제출 (Shift + Enter는 줄바꿈)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--instagram-border)] px-4 py-3 flex items-center gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="댓글 달기..."
        disabled={isSubmitting || disabled}
        className="flex-1 min-h-[40px] max-h-[100px] resize-none border-0 focus-visible:ring-0 text-instagram-sm placeholder:text-[var(--text-secondary)] bg-transparent"
        rows={1}
      />

      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting || disabled}
        variant="ghost"
        size="sm"
        className="text-[var(--instagram-blue)] hover:text-[var(--instagram-blue)]/80 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 h-auto font-instagram-semibold"
      >
        {isSubmitting ? "게시 중..." : "게시"}
      </Button>
    </div>
  );
}

