import type { NextConfig } from "next";

// Derive Supabase hostname from env at build time (works on Vercel)
const SUPABASE_HOST = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return undefined;
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" }, // Clerk 이미지
      { protocol: "https", hostname: "picsum.photos" }, // 테스트 이미지 (picsum)
      { protocol: "https", hostname: "via.placeholder.com" }, // 기존 테스트 이미지 (placeholder)
      // Supabase Storage: ONLY when env is provided. Pathname limited to public storage route
      ...(SUPABASE_HOST
        ? [{ protocol: "https" as const, hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
    // 고해상도 WebP/AVIF 지원 (품질/호환성 개선)
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
