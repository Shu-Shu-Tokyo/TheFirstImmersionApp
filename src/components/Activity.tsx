import React, { useState } from 'react';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { WatchSession, ManualLog, Show, User as UserType } from '../types';

interface ActivityProps {
  watchSessions: WatchSession[];
  manualLogs: ManualLog[];
  shows: Show[];
  user: UserType;
  onDeleteActivity: (activityId: string, activityType: 'session' | 'manual') => void;
}

interface ActivityItem {
  id: string;
  type: 'content' | 'manual';
  title: string;
  thumbnail: string;
  platform: string;
  date: string;
  timestamp: number;
  duration: number; // in minutes
  userId: string;
  userName: string;
  userAvatar: string;
  notes?: string;
  studyMode?: 'passive' | 'active';
}

export const Activity: React.FC<ActivityProps> = ({ 
  watchSessions, 
  manualLogs, 
  shows, 
  user,
  onDeleteActivity
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDeleteActivityConfirm, setShowDeleteActivityConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{id: string, type: 'session' | 'manual', title: string} | null>(null);

  // Convert sessions and logs to activity items
  const allActivities: ActivityItem[] = [
    ...watchSessions.map(session => {
      const content = getContentInfo(session.videoId, shows);
      return {
        id: session.id,
        type: 'content' as const,
        title: content.title,
        thumbnail: content.thumbnail,
        platform: '',
        date: new Date(session.date).toISOString().split('T')[0],
        timestamp: new Date(session.date).getTime(),
        duration: Math.round(session.duration / 60000), // Convert to minutes
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        studyMode: session.studyMode || 'passive'
      };
    }),
    ...manualLogs.map(log => ({
      id: log.id,
      type: 'manual' as const,
      title: log.title,
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
      platform: log.platform,
      date: log.date,
      timestamp: new Date(log.date).getTime(),
      duration: log.duration,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      notes: log.notes,
      studyMode: log.studyMode || 'passive'
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredActivities = allActivities.filter(activity => {
    const matchesDate = !selectedDate || activity.date === selectedDate;
    return matchesDate;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  function getContentInfo(videoId: string, shows: Show[]) {
    for (const show of shows) {
      for (const season of show.seasons) {
        for (const episode of season.episodes) {
          if (`${show.id}-${episode.id}` === videoId) {
            return {
              title: `${show.title} S${season.number}E${episode.number}: ${episode.title}`,
              thumbnail: show.thumbnail
            };
          }
        }
      }
    }
    return {
      title: 'Unknown Content',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'
    };
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const handleDeleteActivityClick = (activityId: string, activityType: 'session' | 'manual', title: string) => {
    setActivityToDelete({ id: activityId, type: activityType, title });
    setShowDeleteActivityConfirm(true);
  };

  const confirmDeleteActivity = () => {
    if (activityToDelete) {
      onDeleteActivity(activityToDelete.id, activityToDelete.type);
      setActivityToDelete(null);
      setShowDeleteActivityConfirm(false);
    }
  };

  const cancelDeleteActivity = () => {
    setActivityToDelete(null);
    setShowDeleteActivityConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex justify-end items-center space-x-2">
        <label htmlFor="date-filter" className="text-sm font-medium text-slate-300">Filter by date:</label>
        <input
          type="date"
          id="date-filter"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, activities]) => (
          <div key={date} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-white">{formatDate(date)}</h3>
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-sm text-slate-400">
                {formatDuration(activities.reduce((sum, activity) => sum + activity.duration, 0))}
              </span>
            </div>

            {/* Activity Cards */}
            <div className="space-y-3 ml-6">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 overflow-hidden transition-all duration-200">
                  {/* Activity Header */}
                  <div className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* User Avatar */}
                      <img
                        src={activity.userAvatar}
                        alt={activity.userName}
                        className="w-12 h-12 rounded-full border-2 border-slate-600"
                      />
                      
                      {/* Content Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-white">{activity.userName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-400 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.studyMode === 'active' 
                             ? 'bg-red-500/20 text-red-400' 
                             : 'bg-green-500/20 text-green-400'
                          }`}>
                            {activity.studyMode === 'active' ? 'Active Study' : 'Passive Immersion'}
                          </span>
                          <span className={`text-xs font-medium ${
                            activity.studyMode === 'active' 
                             ? 'text-red-400' 
                             : 'text-green-400'
                          }`}>
                            {formatDuration(activity.duration)}
                          </span>
                          <span>
                            {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Content Thumbnail and Details */}
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={activity.thumbnail}
                            alt={activity.title}
                            className="w-16 h-12 object-cover rounded-lg border border-slate-600"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-white flex items-center">
                              <span className="text-2xl font-bold">{activity.title.replace('Library Content', '')}</span>
                            </h4>
                            {activity.notes && (
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm text-slate-400">{activity.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleDeleteActivityClick(
                              activity.id, 
                              activity.type === 'content' ? 'session' : 'manual',
                              activity.title
                            )}
                            className="p-2 rounded-lg bg-transparent border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Activity Found</h3>
          <p className="text-slate-400">
            {selectedDate 
              ? `No study sessions recorded for ${selectedDate}` 
              : 'Start studying content to see your activity timeline here'
            }
          </p>
        </div>
      )}

      {/* Delete Activity Confirmation Modal */}
      {showDeleteActivityConfirm && activityToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Activity Log</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete the activity log for "{activityToDelete.title}"? This action cannot be undone and will remove this record from your study history.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteActivity}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteActivity}
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