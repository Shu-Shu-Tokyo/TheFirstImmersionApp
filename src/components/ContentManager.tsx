import React, { useState } from 'react';
import { Plus, Save, Edit, Trash2, Clock, Tv, Youtube, Music, Globe } from 'lucide-react';
import { Show, Season, Episode } from '../types';
import { supabase, uploadImage, STORAGE_BUCKETS } from '../lib/supabase';

interface ContentManagerProps {
  shows: Show[];
  onAddShow: (show: Show) => void;
  onUpdateShow: (showId: string, updates: Partial<Show>) => void;
  onDeleteShow: (showId: string) => void;
  userId: string;
}

export const ContentManager: React.FC<ContentManagerProps> = ({
  shows,
  onAddShow,
  onUpdateShow,
  onDeleteShow,
  userId
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showDeleteShowConfirm, setShowDeleteShowConfirm] = useState(false);
  const [showToDelete, setShowToDelete] = useState<Show | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    platform: 'netflix' as string,
    level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    genre: [] as string[],
    totalDuration: 0,
    seasons: [] as Season[]
  });

  const platforms = [
    { id: 'netflix', label: 'Netflix', icon: Tv },
    { id: 'amazon-prime', label: 'Amazon Prime', icon: Tv },
    { id: 'hulu', label: 'Hulu', icon: Tv },
    { id: 'disney-plus', label: 'Disney+', icon: Tv },
    { id: 'hbo-max', label: 'HBO Max', icon: Tv },
    { id: 'apple-tv', label: 'Apple TV+', icon: Tv },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'spotify', label: 'Spotify', icon: Music },
    { id: 'other', label: 'Other', icon: Globe }
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];
  const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Educational', 'News',
    'Entertainment', 'Gaming', 'Music', 'Sports', 'Technology', 'Travel'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert input hours/minutes to duration and calculate total duration
    const seasonsWithCalculatedDurations = formData.seasons.map(season => ({
      ...season,
      episodes: season.episodes.map(episode => {
        const hours = parseInt((episode as any).inputHours, 10) || 0;
        const minutes = parseInt((episode as any).inputMinutes, 10) || 0;
        const calculatedDuration = hours * 60 + minutes;
        
        return {
          id: episode.id,
          number: episode.number,
          title: episode.title,
          duration: calculatedDuration,
          thumbnail: episode.thumbnail || '',
          watched: episode.watched,
          watchCount: episode.watchCount,
          passiveWatchCount: episode.passiveWatchCount || 0,
          activeWatchCount: episode.activeWatchCount || 0
        };
      })
    }));
    
    const totalDuration = seasonsWithCalculatedDurations.reduce((total, season) => 
      total + season.episodes.reduce((seasonTotal, episode) => seasonTotal + episode.duration, 0), 0);
    
    const newShow: Show = {
      id: editingShow?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      thumbnail: formData.thumbnail || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
      platform: formData.platform,
      level: formData.level,
      genre: formData.genre,
      totalDuration: totalDuration,
      seasons: seasonsWithCalculatedDurations,
      rating: 0,
      totalEpisodes: seasonsWithCalculatedDurations.reduce((total, season) => total + season.episodes.length, 0),
      createdBy: userId,
      createdAt: editingShow?.createdAt || Date.now()
    };

    if (editingShow) {
      onUpdateShow(editingShow.id, newShow);
    } else {
      onAddShow(newShow);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      platform: 'netflix',
      level: 'intermediate',
      genre: [],
      totalDuration: 0,
      seasons: []
    });
    setShowForm(false);
    setEditingShow(null);
  };

  const handleEdit = (show: Show) => {
    setEditingShow(show);
    
    // Convert existing durations to input format for editing
    const seasonsWithInputs = show.seasons.map(season => ({
      ...season,
      episodes: season.episodes.map(episode => ({
        ...episode,
        inputHours: String(Math.floor(episode.duration / 60)),
        inputMinutes: String(episode.duration % 60)
      }))
    }));
    
    setFormData({
      title: show.title,
      description: show.description,
      thumbnail: show.thumbnail,
      platform: show.platform,
      level: show.level,
      genre: show.genre,
      totalDuration: show.totalDuration,
      seasons: seasonsWithInputs
    });
    setShowForm(true);
  };

  const handleDeleteShowClick = (show: Show) => {
    setShowToDelete(show);
    setShowDeleteShowConfirm(true);
  };

  const confirmDeleteShow = () => {
    if (showToDelete) {
      onDeleteShow(showToDelete.id);
      setShowToDelete(null);
      setShowDeleteShowConfirm(false);
    }
  };

  const cancelDeleteShow = () => {
    setShowToDelete(null);
    setShowDeleteShowConfirm(false);
  };

  const addSeason = () => {
    const newSeason: Season = {
      id: Date.now().toString(),
      number: formData.seasons.length + 1,
      title: formData.platform === 'youtube' ? 'Videos' : `Season ${formData.seasons.length + 1}`,
      episodes: []
    };
    setFormData(prev => ({
      ...prev,
      seasons: [...prev.seasons, newSeason]
    }));
  };

  const updateSeason = (seasonIndex: number, updates: Partial<Season>) => {
    setFormData(prev => ({
      ...prev,
      seasons: prev.seasons.map((season, index) => 
        index === seasonIndex ? { ...season, ...updates } : season
      )
    }));
  };

  const addEpisode = (seasonIndex: number) => {
    const season = formData.seasons[seasonIndex];
    const newEpisode = {
      id: Date.now().toString(),
      number: season.episodes.length + 1,
      title: formData.platform === 'youtube' ? 'New Video' : `Episode ${season.episodes.length + 1}`,
      duration: 30, // Default 30 minutes
      thumbnail: '',
      watched: false,
      watchCount: 0,
      passiveWatchCount: 0,
      activeWatchCount: 0,
      inputHours: '0',
      inputMinutes: '30'
    };

    updateSeason(seasonIndex, {
      episodes: [...season.episodes, newEpisode]
    });
  };

  const updateEpisode = (seasonIndex: number, episodeIndex: number, updates: any) => {
    const updatedEpisodes = [...formData.seasons[seasonIndex].episodes];
    updatedEpisodes[episodeIndex] = { ...updatedEpisodes[episodeIndex], ...updates };
    
    updateSeason(seasonIndex, { episodes: updatedEpisodes });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileName = `${currentUser.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const thumbnailUrl = await uploadImage(file, STORAGE_BUCKETS.THUMBNAILS, fileName);

      if (thumbnailUrl) {
        setFormData(prev => ({ ...prev, thumbnail: thumbnailUrl }));
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const userShows = shows.filter(show => show.createdBy === userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Content Manager</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Content</span>
        </button>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userShows.map((show) => (
          <div key={show.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="relative">
              <img
                src={show.thumbnail}
                alt={show.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 right-3 flex space-x-2">
                <button
                  onClick={() => handleEdit(show)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteShowClick(show)}
                 className="bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-lg font-medium transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  show.level === 'beginner' ? 'bg-green-500/80 text-white' :
                  show.level === 'intermediate' ? 'bg-yellow-500/80 text-white' :
                  'bg-red-500/80 text-white'
                }`}>
                  {show.level}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {platforms.find(platform => platform.id === show.platform)?.icon && 
                  React.createElement(platforms.find(platform => platform.id === show.platform)!.icon, { className: "w-4 h-4 text-blue-400" })
                }
                <span className="text-xs text-blue-400 capitalize">{platforms.find(p => p.id === show.platform)?.label || show.platform}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{show.title}</h3>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{show.description}</p>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{show.totalEpisodes} episodes</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{Math.floor(show.totalDuration / 60)}h {show.totalDuration % 60}m</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingShow ? 'Edit Content' : 'Add New Content'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                <span className="text-slate-400 text-xl">✕</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Content title..."
                  required
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Thumbnail Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploading && (
                  <p className="text-sm text-blue-400 mt-2">Uploading image...</p>
                )}
                {formData.thumbnail && (
                  <img src={formData.thumbnail} alt="Thumbnail preview" className="mt-4 w-32 h-auto rounded-lg" />
                )}
              </div>

              {/* Platform and Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platforms.map(platform => (
                      <option key={platform.id} value={platform.id}>{platform.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                    className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Brief description of the content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Genres
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {genres.map(genre => (
                    <label key={genre} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.genre.includes(genre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, genre: [...prev.genre, genre] }));
                          } else {
                            setFormData(prev => ({ ...prev, genre: prev.genre.filter(g => g !== genre) }));
                          }
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seasons and Episodes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {formData.platform === 'youtube' ? 'Video Collections' : 
                     formData.platform === 'other' ? 'Content Details' : 'Seasons & Episodes'}
                  </h3>
                  <button
                    type="button"
                    onClick={addSeason}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                  >
                    Add {formData.platform === 'youtube' ? 'Collection' : formData.platform === 'other' ? 'Version' : 'Season'}
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.seasons.map((season, seasonIndex) => (
                    <div key={season.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={season.title || `Season ${season.number}`}
                          onChange={(e) => updateSeason(seasonIndex, { title: e.target.value })}
                          className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                          placeholder={formData.platform === 'youtube' ? 'Collection Name' : 'Season Title'}
                        />
                        <button
                          type="button"
                          onClick={() => addEpisode(seasonIndex)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                        >
                          Add {formData.platform === 'youtube' ? 'Video' : 'Episode'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {season.episodes.map((episode, episodeIndex) => (
                          <div key={episode.id} className="bg-slate-800 rounded p-3 space-y-2">
                            <input
                              type="text"
                              value={episode.title}
                              onChange={(e) => updateEpisode(seasonIndex, episodeIndex, { title: e.target.value })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                              placeholder={formData.platform === 'youtube' ? 'Video Title' : 'Episode Title'}
                            />
                            <div className="flex items-center space-x-2 flex-wrap">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={(episode as any).inputHours || '0'}
                                  onChange={(e) => {
                                    updateEpisode(seasonIndex, episodeIndex, { inputHours: e.target.value });
                                  }}
                                  className="w-12 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                  placeholder="0"
                                  min="0"
                                  max="99"
                                />
                                <span className="text-xs text-slate-400">h</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={(episode as any).inputMinutes || '0'}
                                  onChange={(e) => {
                                    updateEpisode(seasonIndex, episodeIndex, { inputMinutes: e.target.value });
                                  }}
                                  className="w-12 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                  placeholder="0"
                                  min="0"
                                  max="59"
                                />
                                <span className="text-xs text-slate-400">m</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedEpisodes = season.episodes.filter((_, idx) => idx !== episodeIndex);
                                  updateSeason(seasonIndex, { episodes: updatedEpisodes });
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {season.episodes.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-sm">
                          No {formData.platform === 'youtube' ? 'videos' : 'episodes'} added yet. Click "Add {formData.platform === 'youtube' ? 'Video' : 'Episode'}" to get started.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {formData.seasons.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No {formData.platform === 'youtube' ? 'collections' : formData.platform === 'other' ? 'versions' : 'seasons'} added yet. Click "Add {formData.platform === 'youtube' ? 'Collection' : formData.platform === 'other' ? 'Version' : 'Season'}" to get started.
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingShow ? 'Update Content' : 'Add Content'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Show Confirmation Modal */}
      {showDeleteShowConfirm && showToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Content</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete "{showToDelete.title}"? This action cannot be undone and will remove all episodes and associated data.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteShow}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteShow}
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
};