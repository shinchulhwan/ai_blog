export type NavIcon =
  | "blog"
  | "project"
  | "keyword"
  | "prompt"
  | "history"
  | "image"
  | "seo"
  | "settings";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "블로그 작성",
    icon: "blog",
    description: "키워드로 SEO 최적화 블로그 글을 생성합니다.",
  },
  {
    href: "/projects",
    label: "프로젝트",
    icon: "project",
    description: "AI 블로그 프로젝트를 생성·관리합니다.",
  },
  {
    href: "/keywords",
    label: "키워드 관리",
    icon: "keyword",
    description: "자동 생성 대기 키워드를 등록·관리합니다.",
  },
  {
    href: "/prompts",
    label: "프롬프트 관리",
    icon: "prompt",
    description: "블로그 생성에 사용할 프롬프트를 관리합니다.",
  },
  {
    href: "/history",
    label: "생성 이력",
    icon: "history",
    description: "AI가 생성한 블로그 글 이력을 확인·관리합니다.",
  },
  {
    href: "/images",
    label: "이미지 생성",
    icon: "image",
    description: "블로그용 대표·본문 이미지를 생성합니다.",
  },
  {
    href: "/seo",
    label: "SEO 분석",
    icon: "seo",
    description: "블로그 글의 SEO 점수와 개선점을 분석합니다.",
  },
  {
    href: "/settings",
    label: "설정",
    icon: "settings",
    description: "API 키 및 앱 환경 설정을 관리합니다.",
  },
] as const;
