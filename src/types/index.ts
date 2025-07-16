export interface User {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  maxStreak: number;
  totalHours: number;
  weeklyGoalHours: number;
  totalGoalHours: number;
  badges: Badge[];
  joinedAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  show?: string;
  season?: number;
  episode?: number;
  addedAt: number;
  watchCount: number;
  lastWatched?: number;
  totalWatchTime: number;
  goalWatches: number;
  tags: string[];
  rating: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt: number;
  lastReviewed?: number;
  cardCount: number;
  createdBy: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  videoId: string;
  videoTitle: string;
  front: string;
  back: string;
  frontImage?: string;
  backImage?: string;
  context: string;
  timestamp: number;
  createdAt: number;
  lastReviewed: number;
  nextReview: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  difficulty: 'again' | 'hard' | 'good' | 'easy';
  isPublic: boolean;
  likes: number;
  createdBy: string;
}

export interface WatchSession {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  duration: number;
  date: string;
  flashcardsCreated: number;
  studyMode: 'passive' | 'active';
}

export interface Show {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  genre: string[];
  totalDuration: number; // in minutes
  seasons: Season[];
  rating: number;
  totalEpisodes: number;
  createdBy: string;
  createdAt: number;
}

export interface Season {
  id: string;
  number: number;
  title?: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: number;
  thumbnail: string;
  videoUrl?: string;
  watched: boolean;
  watchCount: number;
  passiveWatchCount: number;
  activeWatchCount: number;
  lastWatched?: number;
}

export interface ManualLog {
  id: string;
  title: string;
  platform: string;
  duration: number;
  date: string;
  notes?: string;
  studyMode: 'passive' | 'active';
}