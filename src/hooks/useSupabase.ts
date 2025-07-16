import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Show, FlashcardDeck, Flashcard, WatchSession, ManualLog } from '../types';

// Custom hook for managing user data
export const useUser = (userId?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log('useUser: Fetching user data for userId:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

      if (error) {
        console.error('useUser: Database query error:', error);
        throw error;
      }

      console.log('useUser: Query result - data length:', data?.length, 'error:', error);

      if (data && data.length > 0) {
        const userData = data[0];
        console.log('useUser: User data found:', userData);
        setUser({
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar_url || '',
          streak: userData.streak,
          maxStreak: userData.max_streak,
          totalHours: userData.total_hours,
          weeklyGoalHours: userData.weekly_goal_hours,
          totalGoalHours: userData.total_goal_hours,
          badges: [], // TODO: Implement badges
          joinedAt: new Date(userData.joined_at).getTime()
        });
      } else {
        console.log('useUser: No user data found for userId:', userId);
        // User record will be created by database trigger
        // Wait a moment and retry
        setTimeout(() => {
          fetchUser();
        }, 1000);
      }
    } catch (err) {
      console.error('useUser: Error in fetchUser:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Create a fallback user to prevent infinite loading
      const fallbackUser = {
        id: userId || 'fallback',
        name: 'New User',
        avatar: '',
        streak: 0,
        maxStreak: 0,
        totalHours: 0,
        weeklyGoalHours: 7,
        totalGoalHours: 1000,
        badges: [],
        joinedAt: Date.now()
      };
      console.log('useUser: Setting fallback user due to error:', fallbackUser);
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          avatar_url: updates.avatar,
          streak: updates.streak,
          max_streak: updates.maxStreak,
          total_hours: updates.totalHours,
          weekly_goal_hours: updates.weeklyGoalHours,
          total_goal_hours: updates.totalGoalHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { user, loading, error, updateUser, refetch: fetchUser };
};

// Custom hook for managing shows
export const useShows = (userId?: string) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchShows();
  }, [userId]);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shows')
        .select(`
          *,
          seasons (
            *,
            episodes (*)
          )
        `)
        .eq('created_by', userId);

      if (error) throw error;

      const transformedShows: Show[] = data.map(show => ({
        id: show.id,
        title: show.title,
        description: show.description || '',
        thumbnail: show.thumbnail_url || '',
        platform: show.platform,
        level: show.level as 'beginner' | 'intermediate' | 'advanced',
        genre: show.genre || [],
        totalDuration: show.total_duration,
        seasons: show.seasons.map((season: any) => ({
          id: season.id,
          number: season.number,
          title: season.title,
          episodes: season.episodes.map((episode: any) => ({
            id: episode.id,
            number: episode.number,
            title: episode.title,
            duration: episode.duration,
            thumbnail: episode.thumbnail_url || '',
            videoUrl: episode.video_url,
            watched: episode.watched,
            watchCount: episode.watch_count,
            passiveWatchCount: episode.passive_watch_count,
            activeWatchCount: episode.active_watch_count,
            lastWatched: episode.last_watched ? new Date(episode.last_watched).getTime() : undefined
          }))
        })),
        rating: show.rating,
        totalEpisodes: show.total_episodes,
        createdBy: show.created_by,
        createdAt: new Date(show.created_at).getTime()
      }));

      setShows(transformedShows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addShow = async (show: Show) => {
    try {
      // Insert show
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .insert({
          title: show.title,
          description: show.description,
          thumbnail_url: show.thumbnail,
          platform: show.platform,
          level: show.level,
          genre: show.genre,
          total_duration: show.totalDuration,
          rating: show.rating,
          total_episodes: show.totalEpisodes,
          created_by: userId
        })
        .select()
        .single();

      if (showError) throw showError;

      // Insert seasons and episodes
      for (const season of show.seasons) {
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .insert({
            show_id: showData.id,
            number: season.number,
            title: season.title
          })
          .select()
          .single();

        if (seasonError) throw seasonError;

        if (season.episodes.length > 0) {
          const episodeInserts = season.episodes.map(episode => ({
            season_id: seasonData.id,
            number: episode.number,
            title: episode.title,
            duration: episode.duration,
            thumbnail_url: episode.thumbnail,
            video_url: episode.videoUrl,
            watched: episode.watched,
            watch_count: episode.watchCount,
            passive_watch_count: episode.passiveWatchCount,
            active_watch_count: episode.activeWatchCount,
            last_watched: episode.lastWatched ? new Date(episode.lastWatched).toISOString() : null
          }));

          const { error: episodeError } = await supabase
            .from('episodes')
            .insert(episodeInserts);

          if (episodeError) throw episodeError;
        }
      }

      await fetchShows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const updateShow = async (showId: string, updates: Partial<Show>) => {
    try {
      const { error } = await supabase
        .from('shows')
        .update({
          title: updates.title,
          description: updates.description,
          thumbnail_url: updates.thumbnail,
          platform: updates.platform,
          level: updates.level,
          genre: updates.genre,
          total_duration: updates.totalDuration,
          rating: updates.rating,
          total_episodes: updates.totalEpisodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', showId);

      if (error) throw error;

      // Handle seasons updates if provided
      if (updates.seasons) {
        // This is a complex operation - for now, we'll refetch
        await fetchShows();
      } else {
        setShows(prev => prev.map(show => 
          show.id === showId ? { ...show, ...updates } : show
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteShow = async (showId: string) => {
    try {
      const { error } = await supabase
        .from('shows')
        .delete()
        .eq('id', showId);

      if (error) throw error;

      setShows(prev => prev.filter(show => show.id !== showId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { shows, loading, error, addShow, updateShow, deleteShow, refetch: fetchShows };
};

// Custom hook for managing flashcard decks
export const useFlashcardDecks = (userId?: string) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchDecks();
  }, [userId]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('created_by', userId);

      if (error) throw error;

      const transformedDecks: FlashcardDeck[] = data.map(deck => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        image: deck.image_url,
        createdAt: new Date(deck.created_at).getTime(),
        cardCount: deck.card_count,
        createdBy: deck.created_by
      }));

      setDecks(transformedDecks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addDeck = async (deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cardCount'>) => {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .insert({
          name: deck.name,
          description: deck.description,
          image_url: deck.image,
          created_by: userId
        });

      if (error) throw error;

      await fetchDecks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const updateDeck = async (deckId: string, updates: Partial<FlashcardDeck>) => {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .update({
          name: updates.name,
          description: updates.description,
          image_url: updates.image,
          updated_at: new Date().toISOString()
        })
        .eq('id', deckId);

      if (error) throw error;

      setDecks(prev => prev.map(deck => 
        deck.id === deckId ? { ...deck, ...updates } : deck
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteDeck = async (deckId: string) => {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;

      setDecks(prev => prev.filter(deck => deck.id !== deckId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { decks, loading, error, addDeck, updateDeck, deleteDeck, refetch: fetchDecks };
};

// Custom hook for managing flashcards
export const useFlashcards = (userId?: string) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchFlashcards();
  }, [userId]);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('created_by', userId);

      if (error) throw error;

      const transformedFlashcards: Flashcard[] = data.map(card => ({
        id: card.id,
        deckId: card.deck_id,
        videoId: card.video_id,
        videoTitle: card.video_title,
        front: card.front,
        back: card.back,
        frontImage: card.front_image_url,
        backImage: card.back_image_url,
        context: card.context,
        timestamp: card.timestamp,
        createdAt: new Date(card.created_at).getTime(),
        lastReviewed: new Date(card.last_reviewed).getTime(),
        nextReview: new Date(card.next_review).getTime(),
        easeFactor: card.ease_factor,
        interval: card.interval,
        repetitions: card.repetitions,
        difficulty: card.difficulty as 'again' | 'hard' | 'good' | 'easy',
        isPublic: card.is_public,
        likes: card.likes,
        createdBy: card.created_by
      }));

      setFlashcards(transformedFlashcards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addFlashcard = async (flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'lastReviewed' | 'nextReview' | 'easeFactor' | 'interval' | 'repetitions' | 'difficulty' | 'isPublic' | 'likes' | 'createdBy'>) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({
          deck_id: flashcard.deckId,
          video_id: flashcard.videoId,
          video_title: flashcard.videoTitle,
          front: flashcard.front,
          back: flashcard.back,
          front_image_url: flashcard.frontImage,
          back_image_url: flashcard.backImage,
          context: flashcard.context,
          timestamp: flashcard.timestamp,
          created_by: userId
        });

      if (error) throw error;

      // Update deck card count
      const { error: updateError } = await supabase.rpc('increment_deck_card_count', {
        deck_id: flashcard.deckId
      });

      if (updateError) console.error('Error updating deck card count:', updateError);

      await fetchFlashcards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const updateFlashcard = async (flashcardId: string, updates: Partial<Flashcard>) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          front: updates.front,
          back: updates.back,
          front_image_url: updates.frontImage,
          back_image_url: updates.backImage,
          context: updates.context,
          last_reviewed: updates.lastReviewed ? new Date(updates.lastReviewed).toISOString() : undefined,
          next_review: updates.nextReview ? new Date(updates.nextReview).toISOString() : undefined,
          ease_factor: updates.easeFactor,
          interval: updates.interval,
          repetitions: updates.repetitions,
          difficulty: updates.difficulty,
          updated_at: new Date().toISOString()
        })
        .eq('id', flashcardId);

      if (error) throw error;

      setFlashcards(prev => prev.map(card => 
        card.id === flashcardId ? { ...card, ...updates } : card
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteFlashcard = async (flashcardId: string) => {
    try {
      // Get the card to find its deck
      const cardToDelete = flashcards.find(card => card.id === flashcardId);
      
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId);

      if (error) throw error;

      // Update deck card count
      if (cardToDelete) {
        const { error: updateError } = await supabase.rpc('decrement_deck_card_count', {
          deck_id: cardToDelete.deckId
        });

        if (updateError) console.error('Error updating deck card count:', updateError);
      }

      setFlashcards(prev => prev.filter(card => card.id !== flashcardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { flashcards, loading, error, addFlashcard, updateFlashcard, deleteFlashcard, refetch: fetchFlashcards };
};

// Custom hook for managing watch sessions
export const useWatchSessions = (userId?: string) => {
  const [watchSessions, setWatchSessions] = useState<WatchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchWatchSessions();
  }, [userId]);

  const fetchWatchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('watch_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedSessions: WatchSession[] = data.map(session => ({
        id: session.id,
        videoId: session.video_id,
        startTime: new Date(session.start_time).getTime(),
        endTime: new Date(session.end_time).getTime(),
        duration: session.duration,
        date: session.date,
        flashcardsCreated: session.flashcards_created,
        studyMode: session.study_mode as 'passive' | 'active'
      }));

      setWatchSessions(transformedSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addWatchSession = async (session: WatchSession) => {
    try {
      const { error } = await supabase
        .from('watch_sessions')
        .insert({
          user_id: userId,
          video_id: session.videoId,
          start_time: new Date(session.startTime).toISOString(),
          end_time: new Date(session.endTime).toISOString(),
          duration: session.duration,
          date: session.date,
          flashcards_created: session.flashcardsCreated,
          study_mode: session.studyMode
        });

      if (error) throw error;

      await fetchWatchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteWatchSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('watch_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setWatchSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { watchSessions, loading, error, addWatchSession, deleteWatchSession, refetch: fetchWatchSessions };
};

// Custom hook for managing manual logs
export const useManualLogs = (userId?: string) => {
  const [manualLogs, setManualLogs] = useState<ManualLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchManualLogs();
  }, [userId]);

  const fetchManualLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('manual_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedLogs: ManualLog[] = data.map(log => ({
        id: log.id,
        title: log.title,
        platform: log.platform,
        duration: log.duration,
        date: log.date,
        notes: log.notes,
        studyMode: log.study_mode as 'passive' | 'active'
      }));

      setManualLogs(transformedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addManualLog = async (log: ManualLog) => {
    try {
      const { error } = await supabase
        .from('manual_logs')
        .insert({
          user_id: userId,
          title: log.title,
          platform: log.platform,
          duration: log.duration,
          date: log.date,
          notes: log.notes,
          study_mode: log.studyMode
        });

      if (error) throw error;

      await fetchManualLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteManualLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('manual_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setManualLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { manualLogs, loading, error, addManualLog, deleteManualLog, refetch: fetchManualLogs };
};