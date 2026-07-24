export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Product = {
  id: "redrank" | "finch" | "viewscope";
  nameKo: string;
  nameEn: string;
  domain: string;
  /** 실제 서비스 URL — 확정되면 여기만 바꾸면 됨 */
  url: string | null;
  field: string;
  tagline: string;
  sub: string;
  accent: string;
  accentDim: string;
  mark: string;
  /** 파티클 실루엣 샘플링용 (불투명 배경 아이콘일 때 투명 배경 변형 지정) */
  silhouette?: string;
  /** 파티클 버스트 패턴 */
  burst: "rise" | "murmuration" | "aperture";
  floorY: number;
};

export const PRODUCTS: Product[] = [
  {
    id: "redrank",
    nameKo: "레드랭크",
    nameEn: "REDRANK",
    domain: "redrank.ai",
    url: null,
    field: "BLOG · SEO",
    tagline: "검색의 정상을 선점하다",
    sub: "키워드 발굴부터 상위노출 설계까지 — AI 블로그 SEO 엔진",
    accent: "#FF3B4E",
    accentDim: "#7a0e1c",
    mark: `${BASE}/brand/redrank-icon-neon.svg`,
    silhouette: `${BASE}/brand/redrank-silhouette.svg`,
    burst: "rise",
    floorY: 46,
  },
  {
    id: "finch",
    nameKo: "핀치",
    nameEn: "FINCH",
    domain: "finch.social",
    url: null,
    field: "SNS · SOCIAL",
    tagline: "모든 채널을 한 화면에",
    sub: "인스타그램·틱톡·쓰레드 통합 분석 & 메타광고 관리",
    accent: "#FF6B4A",
    accentDim: "#83301e",
    mark: `${BASE}/brand/finch-mark-coral.svg`,
    burst: "murmuration",
    floorY: 84,
  },
  {
    id: "viewscope",
    nameKo: "뷰스코프",
    nameEn: "VIEWSCOPE",
    domain: "viewscope.io",
    url: null,
    field: "YOUTUBE · VIDEO",
    tagline: "조회수 너머의 인사이트",
    sub: "채널 진단부터 콘텐츠 전략까지 — 유튜브 성장 분석 AI",
    accent: "#1DB886",
    accentDim: "#0c4f3b",
    mark: `${BASE}/brand/viewscope-mark.svg`,
    burst: "aperture",
    floorY: 122,
  },
];

export const CONTACT_EMAIL = "rnjsxogud2165@gmail.com";
