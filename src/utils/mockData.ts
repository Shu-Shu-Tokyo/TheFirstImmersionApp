import { User, Video, Show, Flashcard, Badge } from '../types';

export const createDefaultUser = (): User => ({
  id: 'user1',
  name: 'New User',
  avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNzQ3NDc0Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjYWFhYWFhIi8+CjxwYXRoIGQ9Ik0zMCAxMjBDMzAgMTA0IDUwIDkwIDc1IDkwUzEyMCAxMDQgMTIwIDEyMFYxNTBIMzBWMTIwWiIgZmlsbD0iI2FhYWFhYSIvPgo8L3N2Zz4K',
  streak: 0,
  maxStreak: 0,
  totalHours: 0,
  weeklyGoalHours: 7,
  totalGoalHours: 1000,
  badges: [],
  joinedAt: Date.now()
});

export const mockVideos: Video[] = [];

export const mockShows: Show[] = [];

export const mockFlashcards: Flashcard[] = [];