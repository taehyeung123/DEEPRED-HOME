import type { Metadata, Viewport } from "next";
import { Anton, Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const body = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono2",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://taehyeung123.github.io/DEEPRED-HOME"
  ),
  title: "DEEPRED — 가장 가까운 곳에, AI가 함께합니다",
  description:
    "블로그·SNS·유튜브, 일상에 스며드는 AI. DEEPRED는 Redrank·Finch·Viewscope 세 개의 AI SaaS로 크리에이터와 브랜드의 성장을 설계합니다.",
  keywords: ["DEEPRED", "딥레드", "AI SaaS", "Redrank", "Finch", "Viewscope", "블로그 SEO", "SNS 분석", "유튜브 분석"],
  icons: { icon: `${basePath}/brand/deepred-mark.svg` },
  alternates: { canonical: "/" },
  openGraph: {
    title: "DEEPRED — 가장 가까운 곳에, AI가 함께합니다",
    description:
      "블로그·SNS·유튜브, 일상에 스며드는 AI. Redrank·Finch·Viewscope — DEEPRED의 세 가지 AI SaaS.",
    type: "website",
    locale: "ko_KR",
    // metadataBase(pathname 포함)에 대해 상대 해석되므로 basePath를 붙이지 않는다
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DEEPRED — 가장 가까운 곳에, AI가 함께합니다",
    description: "블로그·SNS·유튜브, 일상에 스며드는 AI. DEEPRED의 세 가지 AI SaaS.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#06060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
