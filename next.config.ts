import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },           // Clerk 이미지
      { hostname: "picsum.photos" },           // 테스트 이미지 (picsum)
      { hostname: "via.placeholder.com" },     // 기존 테스트 이미지 (placeholder)
      { hostname: "wwugavvqocqznxhfnqxb.supabase.co" }, // Supabase Storage
    ],
  },
};

export default nextConfig;
