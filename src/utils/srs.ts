import { Flashcard } from '../types';

export class SRSAlgorithm {
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  private static readonly MINIMUM_EASE_FACTOR = 1.3;
  private static readonly EASE_FACTOR_MODIFIER = 0.1;
  private static readonly MINIMUM_INTERVAL = 1;

  static calculateNextReview(
    flashcard: Flashcard,
    difficulty: 'again' | 'hard' | 'good' | 'easy'
  ): Partial<Flashcard> {
    const now = Date.now();
    let { easeFactor, interval, repetitions } = flashcard;
    
    let newInterval: number;
    let newEaseFactor = easeFactor;
    let newRepetitions = repetitions;

    switch (difficulty) {
      case 'again':
        newInterval = this.MINIMUM_INTERVAL;
        newRepetitions = 0;
        newEaseFactor = Math.max(
          this.MINIMUM_EASE_FACTOR,
          easeFactor - 0.8
        );
        break;
        
      case 'hard':
        newInterval = Math.max(this.MINIMUM_INTERVAL, interval * 1.2);
        newRepetitions += 1;
        newEaseFactor = Math.max(
          this.MINIMUM_EASE_FACTOR,
          easeFactor - 0.15
        );
        break;
        
      case 'good':
        if (repetitions === 0) {
          newInterval = 1;
        } else if (repetitions === 1) {
          newInterval = 6;
        } else {
          newInterval = Math.round(interval * easeFactor);
        }
        newRepetitions += 1;
        break;
        
      case 'easy':
        if (repetitions === 0) {
          newInterval = 4;
        } else if (repetitions === 1) {
          newInterval = 6;
        } else {
          newInterval = Math.round(interval * easeFactor * 1.3);
        }
        newRepetitions += 1;
        newEaseFactor = easeFactor + this.EASE_FACTOR_MODIFIER;
        break;
    }

    const nextReview = now + (newInterval * 24 * 60 * 60 * 1000);

    return {
      lastReviewed: now,
      nextReview,
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      difficulty
    };
  }

  static getDueCards(flashcards: Flashcard[]): Flashcard[] {
    const now = Date.now();
    return flashcards.filter(card => card.nextReview <= now);
  }

  static getNewCards(flashcards: Flashcard[], limit: number = 10): Flashcard[] {
    return flashcards
      .filter(card => card.repetitions === 0)
      .slice(0, limit);
  }
}