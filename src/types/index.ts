// Student types
export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  avatarUrl?: string;
  currentStreak: number;
  maxStreak: number;
  lastActivityDate?: string;
}

// Company types
export interface Company {
  id: string;
  title: string;
  slug: string;
  founder: string;
  founderVerified: boolean;
  foundedYear?: number;
  industry?: string;
  headquarters?: string;
  description?: string;
  coverUrl?: string;
  averageRating: number;
  totalLessons: number;
  totalInspired: number;
  totalGameChangers: number;
  totalSaves: number;
  totalDuration?: number;
  tags: string[];
  isPublished: boolean;
}

// Lesson (video) types
export interface Lesson {
  id: string;
  companyId: string;
  title: string;
  lessonNumber: number;
  keyLesson: string;
  videoUrl: string;
  videoThumbnailUrl?: string;
  durationSeconds: number;
  audioTrackName?: string;
  categoryType: CategoryType;
  inspiredCount: number;
  gameChangerCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
  orderIndex: number;
}

// Feed item combines lesson with company info
export interface FeedItem extends Lesson {
  companyTitle: string;
  companyFounder: string;
  companyFounderVerified: boolean;
  companyCoverUrl?: string;
  companyTotalLessons: number;
  // User-specific state
  hasInspired?: boolean;
  hasGameChanged?: boolean;
  hasBookmarked?: boolean;
  isViewed?: boolean;
}

// Category types
export type CategoryType =
  | 'tecnologia'
  | 'liderazgo'
  | 'marketing'
  | 'finanzas'
  | 'innovacion'
  | 'impacto'
  | 'resiliencia';

export interface Category {
  code: CategoryType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Reactions
export type ReactionType = 'inspired' | 'game_changer';

// Company progress
export interface CompanyProgress {
  id: string;
  companyId: string;
  lessonsViewed: number;
  lessonsCompleted: number;
  progressPercent: number;
  status: 'exploring' | 'completed';
  startedAt: string;
  completedAt?: string;
  lastViewedAt: string;
  // Joined data
  company?: Company;
}

// Bookmark
export interface BookmarkItem {
  lessonId: string;
  createdAt: string;
  lesson?: Lesson;
  companyTitle?: string;
  companyFounder?: string;
}

// Playlist
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverColor: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  lessonId: string;
  orderIndex: number;
  lesson?: Lesson;
}

// Collection (curated)
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  gradientFrom: string;
  gradientTo: string;
  isFeatured: boolean;
  companyCount?: number;
}

// Reflection
export interface Reflection {
  id: string;
  lessonId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lessonTitle?: string;
  companyTitle?: string;
}

// Student category profile
export interface StudentCategory {
  categoryCode: CategoryType;
  score: number;
  lessonsConsumed: number;
}

// Profile stats
export interface ProfileStats {
  totalCompaniesExplored: number;
  totalLessonsDiscovered: number;
  currentStreak: number;
  maxStreak: number;
  categories: StudentCategory[];
}

// Search
export interface SearchResult {
  companies: Company[];
  lessons: Lesson[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// WebView Bridge types
export interface SuperAppMessage {
  type: 'NOTIFICATION' | 'LOGOUT' | 'NAVIGATE' | 'CLOSE' | 'REFRESH';
  payload?: Record<string, unknown>;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
