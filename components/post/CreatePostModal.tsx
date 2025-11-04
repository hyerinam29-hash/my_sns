"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

/**
 * CreatePostModal 컴포넌트
 * 
 * 게시물 작성 모달
 * 
 * 주요 기능:
 * 1. 이미지 업로드 (드래그 앤 드롭, 파일 선택)
 * 2. 이미지 미리보기 (1:1 비율)
 * 3. 캡션 입력 (최대 2,200자)
 * 4. 글자 수 표시
 * 5. 공유하기 버튼
 * 6. 로딩 상태 처리
 * 
 * @param open - 모달 열림 상태
 * @param onOpenChange - 모달 상태 변경 핸들러
 */
interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function CreatePostModal({
  open,
  onOpenChange,
  onPostCreated,
}: CreatePostModalProps) {
  const { userId: clerkUserId, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((file: File) => {
    // 파일 타입 검증
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("이미지 파일만 업로드 가능합니다.\n지원 형식: JPEG, PNG, WebP, GIF");
      return;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      alert(`파일 크기가 너무 큽니다.\n최대: 5MB\n현재: ${fileSizeMB}MB`);
      return;
    }

    setSelectedFile(file);

    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    console.log("파일 선택됨:", file.name, "크기:", file.size);
  }, []);

  // 파일 입력 변경 핸들러
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 공유하기 버튼 클릭
  const handleShare = async () => {
    if (!selectedFile) {
      alert("이미지를 선택해주세요.");
      return;
    }

    if (!isLoaded || !clerkUserId) {
      alert("로그인이 필요합니다.\n로그인 후 다시 시도해주세요.");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      console.group("📤 게시물 작성 및 이미지 업로드");
      console.log("이미지 파일:", selectedFile.name);
      console.log("캡션:", caption);

      // Supabase users 테이블에서 user_id 조회
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (userError || !userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      console.log("Supabase user_id:", userData.id);

      // 파일 경로 생성: posts/{user_id}/{timestamp}_{filename}
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split(".").pop() || "jpg";
      const sanitizedFileName = selectedFile.name
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .substring(0, 50); // 파일명 길이 제한
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `${userData.id}/${fileName}`;

      console.log("업로드 경로:", filePath);

      // Supabase Storage에 이미지 업로드
      setUploadProgress(30);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("업로드 오류:", uploadError);
        throw new Error(uploadError.message || "이미지 업로드에 실패했습니다.");
      }

      setUploadProgress(70);
      console.log("이미지 업로드 성공:", uploadData.path);

      // 업로드된 이미지의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from("posts")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;
      console.log("이미지 URL:", imageUrl);

      setUploadProgress(90);

      // 게시물 생성 API 호출
      console.log("게시물 생성 API 호출 중...");
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "게시물 생성에 실패했습니다.");
      }

      const result = await response.json();
      console.log("게시물 생성 성공:", result.post.id);

      setUploadProgress(100);
      console.groupEnd();

      // 게시물 생성 성공 콜백 호출
      onPostCreated?.();

      // 성공 후 모달 닫기 및 초기화
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error("게시물 작성 오류:", error);
      
      // 에러 메시지 표시 (사용자 친화적)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "게시물 작성에 실패했습니다. 잠시 후 다시 시도해주세요.";
      
      alert(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기 및 초기화
  const handleClose = () => {
    setSelectedFile(null);
    setCaption("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose();
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="max-w-2xl w-full p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-center font-instagram-semibold text-instagram-base">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row">
          {/* 이미지 업로드 영역 (좌측 또는 상단) */}
          <div className="w-full md:w-1/2 bg-[var(--instagram-background)]">
            {!previewUrl ? (
              <div
                className={`relative w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed transition-colors ${
                  isDragging
                    ? "border-[var(--instagram-blue)] bg-blue-50"
                    : "border-[var(--instagram-border)]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <Upload className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
                <p className="text-instagram-base font-instagram-semibold text-[var(--text-primary)] mb-2">
                  사진과 동영상을 여기에 끌어다 놓으세요
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                >
                  컴퓨터에서 선택
                </Button>
                <p className="text-instagram-xs text-[var(--text-secondary)] mt-4">
                  최대 5MB, JPEG, PNG, WebP, GIF
                </p>
              </div>
            ) : (
              <div className="relative w-full aspect-square bg-[var(--instagram-background)]">
                <Image
                  src={previewUrl}
                  alt="미리보기"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* 캡션 입력 영역 (우측 또는 하단) */}
          <div className="w-full md:w-1/2 flex flex-col bg-[var(--instagram-card-background)]">
            {/* 사용자 정보 (향후 추가) */}
            <div className="px-4 py-3 border-b border-[var(--instagram-border)]">
              <p className="text-instagram-sm font-instagram-semibold text-[var(--text-primary)]">
                사용자명
              </p>
            </div>

            {/* 캡션 입력 필드 */}
            <div className="flex-1 p-4">
              <Textarea
                placeholder="문구 입력..."
                value={caption}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= MAX_CAPTION_LENGTH) {
                    setCaption(value);
                  }
                }}
                className="min-h-[200px] resize-none border-0 focus-visible:ring-0 text-instagram-sm"
                maxLength={MAX_CAPTION_LENGTH}
              />
              <div className="flex justify-end mt-2">
                <span
                  className={`text-instagram-xs ${
                    caption.length >= MAX_CAPTION_LENGTH
                      ? "text-[var(--like-red)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {caption.length}/{MAX_CAPTION_LENGTH}
                </span>
              </div>
            </div>

            {/* 업로드 진행률 표시 */}
            {isLoading && uploadProgress > 0 && (
              <div className="px-4 pt-4">
                <div className="w-full bg-[var(--instagram-border)] rounded-full h-2">
                  <div
                    className="bg-[var(--instagram-blue)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-instagram-xs text-[var(--text-secondary)] text-center mt-2">
                  {uploadProgress < 50
                    ? "이미지 업로드 중..."
                    : uploadProgress < 90
                    ? "이미지 처리 중..."
                    : "거의 완료..."}
                </p>
              </div>
            )}

            {/* 공유하기 버튼 */}
            <div className="px-4 py-4 border-t border-[var(--instagram-border)]">
              <Button
                onClick={handleShare}
                disabled={!selectedFile || isLoading}
                className="w-full bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "공유 중..." : "공유하기"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

