import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Activity } from './components/Activity';
import { FlashcardSystem } from './components/FlashcardSystem';
import { ContentLibrary } from './components/ContentLibrary';
import { ContentManager } from './components/ContentManager';
import { ProfileEdit } from './components/ProfileEdit';
import { AuthWrapper } from './components/AuthWrapper';
import { 
  useUser,
  useShows,
  useFlashcardDecks,
  useFlashcards,
  useWatchSessions,
  useManualLogs
} from './hooks/useSupabase';
import { 
  Show,
  Episode,
  ManualLog
} from './types';

interface AppContentProps {
  userId: string;
  onSignOut: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ userId, onSignOut }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Supabase hooks
  const { user, updateUser } = useUser(userId);
  const { shows, addShow, updateShow, deleteShow } = useShows(userId);
  const { decks, addDeck, updateDeck, deleteDeck } = useFlashcardDecks(userId);
  const { flashcards, addFlashcard, updateFlashcard, deleteFlashcard } = useFlashcards(userId);
  const { watchSessions, addWatchSession, deleteWatchSession } = useWatchSessions(userId);
  const { manualLogs, addManualLog, deleteManualLog } = useManualLogs(userId);

  // Check if user needs initial setup
  React.useEffect(() => {
    if (user && (!user.name || user.name === 'New User')) {
      setShowProfileEdit(true);
    }
  }, [user]);

  const handleInitialSetup = (userData: Partial<typeof user>) => {
    if (user) {
      updateUser({ ...user, ...userData });
      setShowProfileEdit(false);
    }
  };

  const handleAddManualLog = (log: ManualLog) => {
    addManualLog(log);
    
    // Update user's total hours
    const hoursToAdd = log.duration / 60;
    if (user) {
      updateUser({
        ...user,
        totalHours: user.totalHours + hoursToAdd
      });
    }
  };

  const handleUpdateUser = (updates: Partial<typeof user>) => {
    if (user) {
      updateUser({ ...user, ...updates });
    }
  };

  const handleCreateFlashcard = (flashcardData: Parameters<typeof addFlashcard>[0]) => {
    // Find or create deck for this flashcard
    let deckId = flashcardData.deckId;
    
    // If deckId is actually a deck name (from WatchMenu), find or create the deck
    if (typeof deckId === 'string' && !decks.find(d => d.id === deckId)) {
      const existingDeck = decks.find(d => d.name === deckId);
      if (existingDeck) {
        deckId = existingDeck.id;
      } else {
        // Create new deck
        addDeck({
          name: deckId,
          description: `Auto-created deck for ${deckId}`,
          createdBy: userId
        });
        // For now, use the name as ID until the deck is created
        // This is a temporary solution - in a real app, you'd wait for the deck creation
      }
    }

    addFlashcard({
      ...flashcardData,
      deckId
    });
  };

  const handleSelectContent = (show: Show, episode?: Episode, studyMode?: 'passive' | 'active') => {
    if (!episode || !user) return;

    const newSession = {
      id: Date.now().toString(),
      videoId: `${show.id}-${episode.id}`,
      startTime: Date.now(),
      endTime: Date.now() + (episode.duration * 60 * 1000),
      duration: episode.duration * 60 * 1000,
      date: new Date().toISOString().split('T')[0],
      flashcardsCreated: 0,
      studyMode: studyMode || 'passive'
    };

    addWatchSession(newSession);

    // Update user's total hours
    const hoursToAdd = episode.duration / 60;
    updateUser({
      ...user,
      totalHours: user.totalHours + hoursToAdd
    });
  };

  const handleDeleteActivity = (activityId: string, activityType: 'session' | 'manual') => {
    if (!user) return;

    if (activityType === 'session') {
      const session = watchSessions.find(s => s.id === activityId);
      if (session) {
        deleteWatchSession(activityId);
        
        // Update user's total hours
        const hoursToSubtract = session.duration / (60 * 60 * 1000);
        updateUser({
          ...user,
          totalHours: Math.max(0, user.totalHours - hoursToSubtract)
        });
        
        // Update show episode counts
        const [showId, episodeId] = session.videoId.split('-');
        const show = shows.find(s => s.id === showId);
        if (show) {
          const updatedSeasons = show.seasons.map(season => ({
            ...season,
            episodes: season.episodes.map(ep => 
              ep.id === episodeId 
                ? { 
                    ...ep, 
                    watchCount: Math.max(0, ep.watchCount - 1),
                    passiveWatchCount: session.studyMode === 'passive' 
                      ? Math.max(0, ep.passiveWatchCount - 1) 
                      : ep.passiveWatchCount,
                    activeWatchCount: session.studyMode === 'active' 
                      ? Math.max(0, ep.activeWatchCount - 1) 
                      : ep.activeWatchCount
                  }
                : ep
            )
          }));
          updateShow(showId, { seasons: updatedSeasons });
        }
      }
    } else {
      const log = manualLogs.find(l => l.id === activityId);
      if (log) {
        deleteManualLog(activityId);
        
        // Update user's total hours
        const hoursToSubtract = log.duration / 60;
        updateUser({
          ...user,
          totalHours: Math.max(0, user.totalHours - hoursToSubtract)
        });
      }
    }
  };

  const renderCurrentView = () => {
    if (!user) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            watchSessions={watchSessions}
            flashcards={flashcards}
            videos={[]} // Legacy - no longer used
            onUpdateUser={handleUpdateUser}
          />
        );
      case 'activity':
        return (
          <Activity
            watchSessions={watchSessions}
            manualLogs={manualLogs}
            shows={shows}
            user={user}
            onDeleteActivity={handleDeleteActivity}
          />
        );
      case 'flashcards':
        return (
          <FlashcardSystem
            flashcards={flashcards}
            decks={decks}
            onUpdateFlashcard={updateFlashcard}
            onDeleteFlashcard={deleteFlashcard}
            onCreateDeck={addDeck}
            onUpdateDeck={updateDeck}
            onDeleteDeck={deleteDeck}
            onCreateFlashcard={handleCreateFlashcard}
            userId={userId}
          />
        );
      case 'library':
        return (
          <ContentLibrary
            shows={shows}
            videos={[]} // Legacy - no longer used
            onSelectContent={handleSelectContent}
            onAddVideo={() => {}} // Legacy - no longer used
            onUpdateShow={updateShow}
            userId={userId}
          />
        );
      case 'content-manager':
        return (
          <ContentManager
            shows={shows}
            onAddShow={addShow}
            onUpdateShow={updateShow}
            onDeleteShow={deleteShow}
            userId={userId}
          />
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading your profile...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Reload Page
          </button>
          <p className="text-slate-400 text-sm mt-2">If this persists, check browser console (F12)</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      user={user}
      onEditProfile={() => setShowProfileEdit(true)}
    >
      {renderCurrentView()}
      
      {showProfileEdit && (
        <ProfileEdit
          user={user}
          onUpdateUser={currentView === 'dashboard' && (!user.name || user.name === 'New User') ? handleInitialSetup : handleUpdateUser}
          onClose={() => setShowProfileEdit(false)}
          onSignOut={onSignOut}
        />
      )}
    </Layout>
  );
};

function App() {
  return (
    <AuthWrapper>
      {(userId, onSignOut) => <AppContent userId={userId} onSignOut={onSignOut} />}
    </AuthWrapper>
  );
}

export default App;