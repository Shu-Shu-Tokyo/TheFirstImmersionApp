import React, { useState } from 'react';
import { Search, Filter, Star, Clock, Play, Plus, TrendingUp, Tv, Youtube, Music, Globe } from 'lucide-react';
import { Show, Video, Episode } from '../types';

interface ContentLibraryProps {
  shows: Show[];
  videos: Video[];
  onSelectContent: (show: Show, episode?: Episode, studyMode?: 'passive' | 'active') => void;
  onAddVideo: (video: Video) => void;
  onUpdateShow: (showId: string, updates: Partial<Show>) => void;
  userId: string;
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({
  shows,
  videos,
  onSelectContent,
  onAddVideo,
  onUpdateShow,
  userId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [view, setView] = useState<'movies' | 'tv-shows' | 'anime' | 'youtube'>('tv-shows');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showStudyModeModal, setShowStudyModeModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

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

  const filteredShows = shows.filter(show => {
    const matchesSearch = show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         show.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || show.level === selectedLevel;
    const matchesGenre = selectedGenre === 'all' || show.genre.includes(selectedGenre);
    const matchesPlatform = view === 'all' || show.platform === view;
    
    return matchesSearch && matchesLevel && matchesGenre && matchesPlatform;
  });

  const allGenres = Array.from(new Set(shows.flatMap(show => show.genre)));

  const handleStudyModeSelect = (studyMode: 'passive' | 'active') => {
    if (!selectedShow || !selectedEpisode) return;

    const confirmMessage = `記録完了: ${selectedEpisode.title} (${formatDuration(selectedEpisode.duration)}) - ${studyMode === 'passive' ? 'パッシブ' : 'アクティブ'}イマージョン`;

    // Update episode watch counts
    const updatedSeasons = selectedShow.seasons.map(season => ({
      ...season,
      episodes: season.episodes.map(ep => 
        ep.id === selectedEpisode.id 
          ? { 
              ...ep, 
              watchCount: ep.watchCount + 1,
              passiveWatchCount: studyMode === 'passive' ? ep.passiveWatchCount + 1 : ep.passiveWatchCount,
              activeWatchCount: studyMode === 'active' ? ep.activeWatchCount + 1 : ep.activeWatchCount,
              watched: true, 
              lastWatched: Date.now() 
            }
          : ep
      )
    }));

    // Update local selectedShow state immediately for instant UI update
    const updatedSelectedShow = {
      ...selectedShow,
      seasons: updatedSeasons
    };
    setSelectedShow(updatedSelectedShow);

    onUpdateShow(selectedShow.id, { seasons: updatedSeasons });
    onSelectContent(selectedShow, selectedEpisode, studyMode);
    
    // Update the selectedShow state with the latest data from shows array
    // This ensures the UI reflects the updated watch counts
    setTimeout(() => {
      const latestShow = shows.find(s => s.id === selectedShow.id);
      if (latestShow) {
        setSelectedShow(latestShow);
      }
    }, 100);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 font-medium';
    notification.textContent = confirmMessage;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
    
    setShowStudyModeModal(false);
    setSelectedEpisode(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getShowStats = (show: Show) => {
    let totalPassiveTime = 0;
    let totalActiveTime = 0;
    
    show.seasons.forEach(season => {
      season.episodes.forEach(episode => {
        totalPassiveTime += (episode.passiveWatchCount || 0) * episode.duration;
        totalActiveTime += (episode.activeWatchCount || 0) * episode.duration;
      });
    });
    
    return { totalPassiveTime, totalActiveTime };
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 overflow-x-auto flex-nowrap min-w-0">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              view === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            } flex-shrink-0`}
          >
            <span>All</span>
          </button>
          {platforms.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                view === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } flex-shrink-0`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Genres</option>
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {!selectedShow ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <div 
              key={show.id} 
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all duration-200 group cursor-pointer"
              onClick={() => setSelectedShow(show)}
            >
              <div className="relative">
                <img
                  src={show.thumbnail}
                  alt={show.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-white">{show.rating || 'N/A'}</span>
                  </div>
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
                <h3 className="font-semibold text-white mb-2 line-clamp-1">{show.title}</h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{show.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-wrap gap-1">
                    {show.genre.slice(0, 2).map(genre => (
                      <span key={genre} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{show.totalEpisodes} episodes</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(show.totalDuration)}</span>
                  </div>
                  <span>Click to explore</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Episode Selection */
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedShow(null)}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              ← Back to Library
            </button>
            <h2 className="text-xl font-bold text-white">{selectedShow.title}</h2>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start space-x-6">
              <img
                src={selectedShow.thumbnail}
                alt={selectedShow.title}
                className="w-32 h-48 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedShow.title}</h3>
                <p className="text-slate-300 mb-4">{selectedShow.description}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className="capitalize">{selectedShow.level}</span>
                  <span>{selectedShow.totalEpisodes} episodes</span>
                  <span>{formatDuration(selectedShow.totalDuration)}</span>
                </div>
                
                {/* Show Study Stats */}
                {(() => {
                  const stats = getShowStats(selectedShow);
                  return (
                    <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-2">Study Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">{formatDuration(stats.totalPassiveTime)}</div>
                          <div className="text-slate-400">Passive Immersion Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{formatDuration(stats.totalActiveTime)}</div>
                          <div className="text-slate-400">Active Immersion Time</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Seasons and Episodes */}
          <div className="space-y-6">
            {selectedShow.seasons.map((season) => (
              <div key={season.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {season.title || `Season ${season.number}`}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {season.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      onClick={() => {
                        setSelectedEpisode(episode);
                        setShowStudyModeModal(true);
                      }}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors duration-200">
                            {episode.title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Watch Count Bar */}
                          <div className="flex flex-col items-end space-y-1">
                            <div className="w-20 bg-slate-600 rounded-full h-3 flex overflow-hidden">
                              <div
                                className="bg-green-500 h-3 transition-all duration-300"
                                style={{ width: `${Math.min((episode.passiveWatchCount / 3) * 100, 100)}%` }}
                              />
                              <div
                                className="bg-red-500 h-3 transition-all duration-300"
                                style={{ width: `${Math.min((episode.activeWatchCount / 3) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-400 flex space-x-1">
                              <span className="text-green-400">P:{episode.passiveWatchCount || 0}</span>
                              <span className="text-red-400">A:{episode.activeWatchCount || 0}</span>
                            </div>
                          </div>
                          <Play className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(episode.duration)}</span>
                        </div>
                        {episode.watched && (
                          <span className="text-green-400 text-xs">✓ Watched</span>
                        )}
                      </div>
                      
                      {/* Episode Study Stats */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Passive: {formatDuration((episode.passiveWatchCount || 0) * episode.duration)}</span>
                        <span>Active: {formatDuration((episode.activeWatchCount || 0) * episode.duration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredShows.length === 0 && !selectedShow && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
          <div className="text-slate-400 mb-4">
            <TrendingUp className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No content found</h3>
          <p className="text-slate-400">
            Try adjusting your search or filters, or add new content to your library.
          </p>
        </div>
      )}

      {/* Study Mode Selection Modal */}
      {showStudyModeModal && selectedEpisode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Select Study Mode</h3>
            <p className="text-slate-300 mb-6">
              How did you study "{selectedEpisode.title}"?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleStudyModeSelect('passive')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Passive Immersion</div>
                    <div className="text-sm text-green-100">Watching for enjoyment, background listening</div>
                  </div>
                  <div className="text-2xl">🎧</div>
                </div>
              </button>
              
              <button
                onClick={() => handleStudyModeSelect('active')}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg font-medium transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Active Immersion</div>
                    <div className="text-sm text-red-100">Focused learning, taking notes, creating flashcards</div>
                  </div>
                  <div className="text-2xl">📚</div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowStudyModeModal(false);
                setSelectedEpisode(null);
              }}
              className="w-full mt-4 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};