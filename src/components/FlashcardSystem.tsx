import React, { useState, useEffect, useRef } from 'react';
import { Flashcard, FlashcardDeck } from '../types';
import { Brain, Clock, Star, RotateCcw, CheckCircle, Shuffle, Filter, Plus, Edit, Trash2, SquareStack, Upload, Image, BookOpen, Play, Eye, EyeOff } from 'lucide-react';
import { SRSAlgorithm } from '../utils/srs';
import { triggerConfetti, playSuccessSound } from '../utils/confetti';

interface FlashcardSystemProps {
  flashcards: Flashcard[];
  decks: FlashcardDeck[];
  onUpdateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  onDeleteFlashcard: (id: string) => void;
  onCreateDeck: (deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cardCount'>) => void;
  onUpdateDeck: (id: string, updates: Partial<FlashcardDeck>) => void;
  onDeleteDeck: (id: string) => void;
  onCreateFlashcard: (flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'lastReviewed' | 'nextReview' | 'easeFactor' | 'interval' | 'repetitions' | 'difficulty' | 'isPublic' | 'likes' | 'createdBy'>) => void;
  userId: string;
}

export const FlashcardSystem: React.FC<FlashcardSystemProps> = ({
  flashcards,
  decks,
  onUpdateFlashcard,
  onDeleteFlashcard,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  onCreateFlashcard,
  userId
}) => {
  const [currentView, setCurrentView] = useState<'decks' | 'cards' | 'review' | 'create-deck' | 'create-card'>('decks');
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    startTime: Date.now()
  });

  // Form states
  const [deckForm, setDeckForm] = useState({
    name: '',
    description: '',
    image: ''
  });

  const [cardForm, setCardForm] = useState({
    front: '',
    back: '',
    context: '',
    videoTitle: 'Manual Entry',
    videoId: 'manual',
    timestamp: 0,
    frontImage: '',
    backImage: ''
  });

  // Modal states
  const [showDeleteDeckConfirm, setShowDeleteDeckConfirm] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<FlashcardDeck | null>(null);
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get cards for selected deck
  const deckCards = selectedDeck 
    ? flashcards.filter(card => card.deckId === selectedDeck.id)
    : [];

  // Get due cards count for each deck
  const getDueCardsCount = (deckId: string) => {
    const deckFlashcards = flashcards.filter(card => card.deckId === deckId);
    return SRSAlgorithm.getDueCards(deckFlashcards).length;
  };

  // Get new cards count for each deck
  const getNewCardsCount = (deckId: string) => {
    const deckFlashcards = flashcards.filter(card => card.deckId === deckId);
    return deckFlashcards.filter(card => card.repetitions === 0).length;
  };

  // Start review session
  const startReview = (deck: FlashcardDeck) => {
    const deckFlashcards = flashcards.filter(card => card.deckId === deck.id);
    const dueCards = SRSAlgorithm.getDueCards(deckFlashcards);
    const newCards = SRSAlgorithm.getNewCards(deckFlashcards, 10);
    const queue = [...dueCards, ...newCards];
    
    if (queue.length === 0) {
      alert('No cards available for review!');
      return;
    }

    setReviewQueue(queue);
    setCurrentCard(queue[0]);
    setShowAnswer(false);
    setSessionStats({
      reviewed: 0,
      correct: 0,
      startTime: Date.now()
    });
    setCurrentView('review');
  };

  // Handle review answer
  const handleAnswer = (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    const updates = SRSAlgorithm.calculateNextReview(currentCard, difficulty);
    onUpdateFlashcard(currentCard.id, updates);

    const isCorrect = difficulty === 'good' || difficulty === 'easy';
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));

    if (isCorrect) {
      triggerConfetti();
      playSuccessSound();
    }

    const nextQueue = reviewQueue.slice(1);
    setReviewQueue(nextQueue);
    
    if (nextQueue.length > 0) {
      setCurrentCard(nextQueue[0]);
      setShowAnswer(false);
    } else {
      setCurrentCard(null);
      setCurrentView('decks');
    }
  };

  // Handle deck creation
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckForm.name.trim()) return;

    onCreateDeck({
      name: deckForm.name,
      description: deckForm.description,
      image: deckForm.image,
      createdBy: userId
    });

    setDeckForm({ name: '', description: '', image: '' });
    setCurrentView('decks');
  };

  // Handle deck editing
  const handleEditDeck = (deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setDeckForm({
      name: deck.name,
      description: deck.description || '',
      image: deck.image || ''
    });
    setCurrentView('create-deck'); // Use create-deck view for editing
  };

  const handleUpdateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckForm.name.trim() || !editingDeck) return;

    onUpdateDeck(editingDeck.id, {
      name: deckForm.name,
      description: deckForm.description,
      image: deckForm.image
    });

    setDeckForm({ name: '', description: '', image: '' });
    setEditingDeck(null);
    setCurrentView('decks');
  };

  const cancelEditDeck = () => {
    setDeckForm({ name: '', description: '', image: '' });
    setEditingDeck(null);
    setCurrentView('decks');
  };

  // Handle card creation
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim() || !selectedDeck) return;

    onCreateFlashcard({
      deckId: selectedDeck.id,
      videoId: cardForm.videoId,
      videoTitle: cardForm.videoTitle,
      front: cardForm.front,
      back: cardForm.back,
      context: cardForm.context,
      timestamp: cardForm.timestamp,
      frontImage: cardForm.frontImage,
      backImage: cardForm.backImage
    });

    setCardForm({
      front: '',
      back: '',
      context: '',
      videoTitle: 'Manual Entry',
      videoId: 'manual',
      timestamp: 0,
      frontImage: '',
      backImage: ''
    });
    setCurrentView('cards');
  };

  // Handle delete deck confirmation
  const handleDeleteDeckClick = (deck: FlashcardDeck) => {
    setDeckToDelete(deck);
    setShowDeleteDeckConfirm(true);
  };

  const confirmDeleteDeck = () => {
    if (deckToDelete) {
      onDeleteDeck(deckToDelete.id);
      setDeckToDelete(null);
      setShowDeleteDeckConfirm(false);
    }
  };

  const cancelDeleteDeck = () => {
    setDeckToDelete(null);
    setShowDeleteDeckConfirm(false);
  };

  // Handle card editing
  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setCardForm({
      front: card.front,
      back: card.back,
      context: card.context,
      videoTitle: card.videoTitle,
      videoId: card.videoId,
      timestamp: card.timestamp,
      frontImage: card.frontImage || '',
      backImage: card.backImage || ''
    });
    setCurrentView('create-card'); // Use create-card view for editing
  };

  const handleUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim() || !editingCard) return;

    onUpdateFlashcard(editingCard.id, {
      front: cardForm.front,
      back: cardForm.back,
      context: cardForm.context,
      videoTitle: cardForm.videoTitle,
      videoId: cardForm.videoId,
      timestamp: cardForm.timestamp,
      frontImage: cardForm.frontImage,
      backImage: cardForm.backImage
    });

    setCardForm({
      front: '',
      back: '',
      context: '',
      videoTitle: 'Manual Entry',
      videoId: 'manual',
      timestamp: 0,
      frontImage: '',
      backImage: ''
    });
    setEditingCard(null);
    setCurrentView('cards');
  };

  const cancelEditCard = () => {
    setCardForm({
      front: '',
      back: '',
      context: '',
      videoTitle: 'Manual Entry',
      videoId: 'manual',
      timestamp: 0,
      frontImage: '',
      backImage: ''
    });
    setEditingCard(null);
    setCurrentView('cards');
  };

  // Handle card deletion
  const handleDeleteCardClick = (card: Flashcard) => {
    setCardToDelete(card);
    setShowDeleteCardConfirm(true);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete) {
      onDeleteFlashcard(cardToDelete.id);
      setCardToDelete(null);
      setShowDeleteCardConfirm(false);
    }
  };

  const cancelDeleteCard = () => {
    setCardToDelete(null);
    setShowDeleteCardConfirm(false);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'deck' | 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (target === 'deck') {
          setDeckForm(prev => ({ ...prev, image: result }));
        } else if (target === 'front') {
          setCardForm(prev => ({ ...prev, frontImage: result }));
        } else if (target === 'back') {
          setCardForm(prev => ({ ...prev, backImage: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const difficultyButtons = [
    { id: 'again', label: 'Again', color: 'bg-red-600 hover:bg-red-700', time: '< 1m' },
    { id: 'hard', label: 'Hard', color: 'bg-orange-600 hover:bg-orange-700', time: '< 6m' },
    { id: 'good', label: 'Good', color: 'bg-green-600 hover:bg-green-700', time: '< 10m' },
    { id: 'easy', label: 'Easy', color: 'bg-blue-600 hover:bg-blue-700', time: '4d' }
  ];

  // Render deck view
  if (currentView === 'decks') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Flashcard Decks</h1>
          <button
            onClick={() => setCurrentView('create-deck')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Deck</span>
          </button>
        </div>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
            const dueCount = getDueCardsCount(deck.id);
            const newCount = getNewCardsCount(deck.id);
            
            return (
              <div key={deck.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all duration-200">
                <div className="relative">
                  <img
                    src={deck.image || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={deck.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      onClick={() => handleEditDeck(deck)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeckClick(deck)}
                     className="bg-slate-600 hover:bg-slate-700 text-white p-1 rounded transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2">{deck.name}</h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{deck.description}</p>
                  
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-slate-300">{deck.cardCount} cards</span>
                    <div className="flex space-x-2">
                      {dueCount > 0 && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                          {dueCount} due
                        </span>
                      )}
                      {newCount > 0 && (
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                          {newCount} new
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDeck(deck);
                        setCurrentView('cards');
                      }}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Browse</span>
                    </button>
                    <button
                      onClick={() => startReview(deck)}
                      disabled={dueCount + newCount === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Study</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {decks.length === 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
            <SquareStack className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Decks Yet</h3>
            <p className="text-slate-400 mb-4">Create your first flashcard deck to start learning!</p>
            <button
              onClick={() => setCurrentView('create-deck')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Create Your First Deck
            </button>
          </div>
        )}

        {/* Delete Deck Confirmation Modal */}
        {showDeleteDeckConfirm && deckToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Delete Deck</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete the deck "{deckToDelete.name}"? This action cannot be undone and will also delete all flashcards in this deck.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteDeck}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDeck}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render create/edit deck view
  if (currentView === 'create-deck') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('decks')}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            ← Back to Decks
          </button>
          <h1 className="text-2xl font-bold text-white">
            {editingDeck ? 'Edit Deck' : 'Create New Deck'}
          </h1>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
          <form onSubmit={editingDeck ? handleUpdateDeck : handleCreateDeck} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Deck Name
              </label>
              <input
                type="text"
                value={deckForm.name}
                onChange={(e) => setDeckForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter deck name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Brief description of this deck..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'deck')}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {deckForm.image && (
                <img src={deckForm.image} alt="Deck cover" className="mt-4 w-32 h-20 object-cover rounded-lg" />
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {editingDeck ? 'Save Changes' : 'Create Deck'}
              </button>
              {editingDeck && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeck(editingDeck);
                    setCurrentView('cards');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Manage Cards
                </button>
              )}
              <button
                type="button"
                onClick={editingDeck ? cancelEditDeck : () => setCurrentView('decks')}
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render cards view
  if (currentView === 'cards' && selectedDeck) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedDeck(null);
                setCurrentView('decks');
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              ← Back to Decks
            </button>
            <h1 className="text-2xl font-bold text-white">{selectedDeck.name}</h1>
          </div>
          <button
            onClick={() => setCurrentView('create-card')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deckCards.map((card) => (
            <div key={card.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-all duration-200">
              <div className="flex justify-end space-x-2 mb-3">
                <button
                  onClick={() => handleEditCard(card)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded transition-colors duration-200"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteCardClick(card)}
                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors duration-200"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="mb-3">
                <h3 className="font-semibold text-white mb-1">{card.front}</h3>
                <p className="text-sm text-slate-400">{card.back}</p>
              </div>
              
              {card.context && (
                <p className="text-xs text-slate-500 mb-3 italic">"{card.context}"</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Reps: {card.repetitions}</span>
                <span>Ease: {card.easeFactor.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {deckCards.length === 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Cards Yet</h3>
            <p className="text-slate-400 mb-4">Add your first flashcard to this deck!</p>
            <button
              onClick={() => setCurrentView('create-card')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Add First Card
            </button>
          </div>
        )}

        {/* Delete Card Confirmation Modal */}
        {showDeleteCardConfirm && cardToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Delete Card</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete the card "{cardToDelete.front}"? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteCard}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCard}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render create/edit card view
  if (currentView === 'create-card' && selectedDeck) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('cards')}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            ← Back to Cards
          </button>
          <h1 className="text-2xl font-bold text-white">
            {editingCard ? 'Edit Card' : `Add Card to ${selectedDeck.name}`}
          </h1>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
          <form onSubmit={editingCard ? handleUpdateCard : handleCreateCard} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Front (Question/Word)
              </label>
              <input
                type="text"
                value={cardForm.front}
                onChange={(e) => setCardForm(prev => ({ ...prev, front: e.target.value }))}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the word or question..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Back (Answer/Translation)
              </label>
              <textarea
                value={cardForm.back}
                onChange={(e) => setCardForm(prev => ({ ...prev, back: e.target.value }))}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter the answer or translation..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Context (Optional)
              </label>
              <textarea
                value={cardForm.context}
                onChange={(e) => setCardForm(prev => ({ ...prev, context: e.target.value }))}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Example sentence or context..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {editingCard ? 'Save Changes' : 'Add Card'}
              </button>
              <button
                type="button"
                onClick={editingCard ? cancelEditCard : () => setCurrentView('cards')}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render review view
  if (currentView === 'review') {
    if (reviewQueue.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
            <p className="text-slate-300 mb-4">Great job on completing your review session!</p>
            <div className="bg-slate-700 rounded-lg p-4 max-w-md mx-auto mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Session Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-400">{sessionStats.reviewed}</p>
                  <p className="text-xs text-slate-400">Reviewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {Math.round((sessionStats.correct / Math.max(sessionStats.reviewed, 1)) * 100)}%
                  </p>
                  <p className="text-xs text-slate-400">Accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {Math.round((Date.now() - sessionStats.startTime) / 60000)}
                  </p>
                  <p className="text-xs text-slate-400">minutes</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('decks')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Back to Decks
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">
                Progress: {sessionStats.reviewed} / {reviewQueue.length + sessionStats.reviewed}
              </span>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.round((Date.now() - sessionStats.startTime) / 60000)}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Brain className="w-4 h-4" />
                  <span>{Math.round((sessionStats.correct / Math.max(sessionStats.reviewed, 1)) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(sessionStats.reviewed / (reviewQueue.length + sessionStats.reviewed)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Flashcard */}
          {currentCard && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl">
              <div className="text-center mb-6">
                <div className="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300 mb-4">
                  {currentCard.videoTitle}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{currentCard.front}</h2>
                {currentCard.context && (
                  <p className="text-slate-400 text-sm italic">"{currentCard.context}"</p>
                )}
              </div>

              {!showAnswer ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
                  >
                    <span>Show Answer</span>
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">Answer</h3>
                    <p className="text-slate-300">{currentCard.back}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-slate-300 mb-4">How well did you remember?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {difficultyButtons.map(({ id, label, color, time }) => (
                        <button
                          key={id}
                          onClick={() => handleAnswer(id as any)}
                          className={`${color} text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex flex-col items-center space-y-1`}
                        >
                          <span>{label}</span>
                          <span className="text-xs opacity-75">{time}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};