// src/types/content.ts

export interface CardItem {
  slug: string;
  title: string;
  excerpt: string;
  featureImage: string | null;
  publishedAt: string;
  readingTime?: number;
  primaryTag?: {
    name: string;
    slug: string;
  };
}

export interface ContentListPage {
  data: CardItem[];
  currentPage: number;
  lastPage: number;
  url: {
    current: string;
    prev: string | undefined;
    next: string | undefined;
    first: string | undefined;
    last: string | undefined;
  };
  start: number;
  end: number;
  size: number;
  total: number;
}
