import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Brain, Target, TrendingUp, Award, Calendar, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, WatchSession, Flashcard, Video } from '../types';

interface DashboardProps {
  user: User;
  watchSessions: WatchSession[];
  flashcards: Flashcard[];
  videos: Video[];
  onUpdateUser: (updates: Partial<User>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, watchSessions, flashcards, videos, onUpdateUser }) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [vocabularyWeekOffset, setVocabularyWeekOffset] = useState(0);
  const [showWeeklyGoalSettings, setShowWeeklyGoalSettings] = useState(false);
  const [showTotalGoalSettings, setShowTotalGoalSettings] = useState(false);
  const [weeklyViewMode, setWeeklyViewMode] = useState<'time' | 'type'>('time');
  
  // String-based input states for numerical inputs
  const [weeklyHoursInput, setWeeklyHoursInput] = useState(String(Math.floor(user.weeklyGoalHours || 0)));
  const [weeklyMinutesInput, setWeeklyMinutesInput] = useState(String(Math.round(((user.weeklyGoalHours || 0) % 1) * 60)));
  const [totalHoursInput, setTotalHoursInput] = useState(String(Math.floor(user.totalGoalHours || 0)));
  const [totalMinutesInput, setTotalMinutesInput] = useState(String(Math.round(((user.totalGoalHours || 0) % 1) * 60)));

  // Sync input states when user goals change
  useEffect(() => {
    setWeeklyHoursInput(String(Math.floor(user.weeklyGoalHours || 0)));
    setWeeklyMinutesInput(String(Math.round(((user.weeklyGoalHours || 0) % 1) * 60)));
    setTotalHoursInput(String(Math.floor(user.totalGoalHours || 0)));
    setTotalMinutesInput(String(Math.round(((user.totalGoalHours || 0) % 1) * 60)));
  }, [user.weeklyGoalHours, user.totalGoalHours]);

  // Helper function to handle time input changes
  const parseTimeInputs = (hoursStr: string, minutesStr: string) => {
    const hours = parseInt(hoursStr, 10) || 0;
    const minutes = parseInt(minutesStr, 10) || 0;
    return hours + minutes / 60;
  };

  // Calculate stats
  const totalFlashcards = flashcards.length;
  
  // Calculate weekly progress
  const getCurrentWeekSessions = () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return watchSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });
  };
  
  const currentWeekSessions = getCurrentWeekSessions();
  const currentWeekMinutes = currentWeekSessions.reduce((sum, session) => sum + session.duration, 0) / 60000;
  const currentWeekPassiveMinutes = currentWeekSessions
    .filter(session => session.studyMode === 'passive')
    .reduce((sum, session) => sum + session.duration, 0) / 60000;
  const currentWeekActiveMinutes = currentWeekSessions
    .filter(session => session.studyMode === 'active')
    .reduce((sum, session) => sum + session.duration, 0) / 60000;
  
  const weeklyProgress = {
    current: currentWeekMinutes,
    goal: user.weeklyGoalHours * 60,
    passive: currentWeekPassiveMinutes,
    active: currentWeekActiveMinutes
  };
  
  // Calculate total passive and active hours
  const totalPassiveHours = watchSessions
    .filter(session => session.studyMode === 'passive')
    .reduce((sum, session) => sum + session.duration, 0) / 3600000;
  const totalActiveHours = watchSessions
    .filter(session => session.studyMode === 'active')
    .reduce((sum, session) => sum + session.duration, 0) / 3600000;

  // Weekly data for chart
  const getWeeklyData = (weekOffset: number) => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const daysSessions = watchSessions.filter(session => 
        new Date(session.date).toDateString() === date.toDateString()
      );
      
      const totalHours = daysSessions.reduce((sum, session) => sum + session.duration, 0) / 3600000;
      const passiveHours = daysSessions
        .filter(session => session.studyMode === 'passive')
        .reduce((sum, session) => sum + session.duration, 0) / 3600000;
      const activeHours = daysSessions
        .filter(session => session.studyMode === 'active')
        .reduce((sum, session) => sum + session.duration, 0) / 3600000;
      
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        hours: totalHours,
        passiveHours,
        activeHours
      };
    });
  };

  const getVocabularyData = (weekOffset: number) => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const cardsCreatedOnDate = flashcards.filter(card => 
        card.createdAt >= startOfDay.getTime() && card.createdAt <= endOfDay.getTime()
      ).length;
      
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        cards: cardsCreatedOnDate
      };
    });
  };

  const weeklyData = getWeeklyData(currentWeekOffset);
  const vocabularyData = getVocabularyData(vocabularyWeekOffset);
  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);
  const maxCards = Math.max(...vocabularyData.map(d => d.cards), 1);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const getWeekLabel = (offset: number) => {
    if (offset === 0) return 'This Week';
    if (offset === 1) return 'Last Week';
    return `${offset} weeks ago`;
  };

  // Calculate total goal progress
  const totalGoalProgress = Math.min((user.totalHours / user.totalGoalHours) * 100, 100);
  const totalGoalProgressActual = (user.totalHours / user.totalGoalHours) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 border border-blue-400/30 shadow-xl relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full mix-blend-overlay blur-xl"></div>
          <div className="absolute bottom-6 left-6 w-24 h-24 bg-blue-300/20 rounded-full mix-blend-overlay blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full mix-blend-overlay blur-2xl"></div>
          
          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Streak number and days */}
            <div className="flex items-baseline justify-center space-x-3 mb-4">
              <span className="text-6xl font-extrabold text-white drop-shadow-lg">{user.streak}</span>
              <span className="text-3xl font-bold text-white drop-shadow-md">days</span>
            </div>
            
            {/* Current Streak label */}
            <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">CURRENT STREAK</h3>
            
            {/* Max streak */}
            <p className="text-sm text-white opacity-80 drop-shadow-sm">Personal Best: {user.maxStreak} days</p>
            
            {/* Motivational message */}
            <div className="mt-4 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
              <p className="text-sm font-medium text-white opacity-90 drop-shadow-sm">
                {user.streak === 0 ? "Start your journey today! 🚀" :
                 user.streak < 7 ? "Keep it up! You're building momentum! 💪" :
                 user.streak < 30 ? "Amazing progress! You're on fire! 🔥" :
                 user.streak < 100 ? "Incredible dedication! You're unstoppable! ⚡" :
                 user.streak < 200 ? "LEGENDARY STREAK! You're a true master! 👑" :
                 user.streak < 300 ? "SUPERHUMAN DEDICATION! Nothing can stop you! 🌟" :
                 user.streak < 400 ? "ABSOLUTE LEGEND! You're rewriting the rules! ⭐" :
                 user.streak < 500 ? "GODLIKE CONSISTENCY! You're an inspiration! 🏆" :
                 user.streak < 600 ? "MYTHICAL ACHIEVEMENT! You've transcended limits! 🌌" :
                 user.streak < 700 ? "COSMIC DEDICATION! You're among the elite! 🚀" :
                 user.streak < 800 ? "UNIVERSAL MASTERY! Your commitment is legendary! 🌠" :
                 user.streak < 900 ? "INFINITE POWER! You've achieved the impossible! ⚡" :
                 user.streak < 1000 ? "ULTIMATE WARRIOR! You're unstoppable force! 💎" :
                 "ETERNAL LEGEND! You've reached immortality! 👑✨"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Weekly Progress</span>
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setWeeklyViewMode('time')}
                  className={`px-3 py-1 rounded text-xs transition-colors duration-200 ${
                    weeklyViewMode === 'time' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Time
                </button>
                <button
                  onClick={() => setWeeklyViewMode('type')}
                  className={`px-3 py-1 rounded text-xs transition-colors duration-200 ${
                    weeklyViewMode === 'type' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Type
                </button>
              </div>
              <button
                onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                className="p-1 hover:bg-slate-700 rounded transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-sm text-slate-400 min-w-[80px] text-center">
                {getWeekLabel(currentWeekOffset)}
              </span>
              <button
                onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                disabled={currentWeekOffset === 0}
                className="p-1 hover:bg-slate-700 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 text-xs text-slate-400 font-medium">{day.day}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden relative">
                  {weeklyViewMode === 'time' ? (
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-700 rounded-full transition-all duration-500"
                      style={{ width: `${(day.hours / maxHours) * 100}%` }}
                    />
                  ) : weeklyViewMode === 'type' ? (
                    <div className="h-full flex rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${day.hours > 0 ? (day.passiveHours / day.hours) * ((day.hours / maxHours) * 100) : 0}%` }}
                      />
                      <div
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${day.hours > 0 ? (day.activeHours / day.hours) * ((day.hours / maxHours) * 100) : 0}%` }}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                <div className="w-12 text-xs text-slate-300 text-right">
                  {formatHours(day.hours)}
                </div>
              </div>
            ))}
          </div>
          {weeklyViewMode === 'type' && (
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Passive</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-400">Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary Progress */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Vocabulary Growth</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVocabularyWeekOffset(vocabularyWeekOffset + 1)}
                className="p-1 hover:bg-slate-700 rounded transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-sm text-slate-400 min-w-[80px] text-center">
                {getWeekLabel(vocabularyWeekOffset)}
              </span>
              <button
                onClick={() => setVocabularyWeekOffset(Math.max(0, vocabularyWeekOffset - 1))}
                disabled={vocabularyWeekOffset === 0}
                className="p-1 hover:bg-slate-700 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="space-y-3">
            {vocabularyData.map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 text-xs text-slate-400 font-medium">{day.day}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-700 rounded-full transition-all duration-500"
                    style={{ width: `${maxCards > 0 ? (day.cards / maxCards) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-300 text-right">
                  {day.cards}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Goal Progress Section */}
      <div className="bg-slate-800 rounded-xl p-10 border border-slate-700">
        <h3 className="text-2xl font-semibold text-white mb-8 flex items-center justify-center space-x-2">
          <Target className="w-6 h-6" />
          <span>Study Goal Progress</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Weekly Goal */}
          <div className="text-center">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-white">Weekly Goal</h4>
              <button
                onClick={() => setShowWeeklyGoalSettings(true)}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
              >
                Edit
              </button>
            </div>
            
            {/* Circular Progress for Weekly Goal */}
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-700"
                />
                {/* Passive progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#10b981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min((weeklyProgress.passive / weeklyProgress.goal), 1))}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
                {/* Active progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#ef4444"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min(((weeklyProgress.passive + weeklyProgress.active) / weeklyProgress.goal), 1))}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {Math.round(((weeklyProgress.passive + weeklyProgress.active) / weeklyProgress.goal) * 100)}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400">
              {Math.floor((weeklyProgress.passive + weeklyProgress.active) / 60)}h {Math.round((weeklyProgress.passive + weeklyProgress.active) % 60)}m / {Math.floor(weeklyProgress.goal / 60)}h {Math.round(weeklyProgress.goal % 60)}m
            </p>
            
            {/* Legend for Weekly Goal */}
            <div className="flex items-center justify-center space-x-4 text-xs mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Passive: {Math.floor(weeklyProgress.passive / 60)}h {Math.round(weeklyProgress.passive % 60)}m</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-400">Active: {Math.floor(weeklyProgress.active / 60)}h {Math.round(weeklyProgress.active % 60)}m</span>
              </div>
            </div>
          </div>
          
          {/* Total Goal */}
          <div className="text-center">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-white">Total Goal</h4>
              <button
                onClick={() => setShowTotalGoalSettings(true)}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
              >
                Edit
              </button>
            </div>
            
            {/* Circular Progress for Total Goal */}
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-700"
                />
                {/* Passive progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#10b981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min((totalPassiveHours / user.totalGoalHours), 1))}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
                {/* Active progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#ef4444"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min(((totalPassiveHours + totalActiveHours) / user.totalGoalHours), 1))}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{Math.round(totalGoalProgressActual)}%</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400">
              {Math.floor(user.totalHours)}h {Math.round((user.totalHours % 1) * 60)}m / {Math.floor(user.totalGoalHours)}h {Math.round((user.totalGoalHours % 1) * 60)}m
            </p>
            
            {/* Legend for Total Goal */}
            <div className="flex items-center justify-center space-x-4 text-xs mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Passive: {Math.floor(totalPassiveHours)}h {Math.round((totalPassiveHours % 1) * 60)}m</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-400">Active: {Math.floor(totalActiveHours)}h {Math.round((totalActiveHours % 1) * 60)}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Settings Modal */}
      {showWeeklyGoalSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Goal Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Weekly Goal Hours
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={weeklyHoursInput}
                      onChange={(e) => setWeeklyHoursInput(e.target.value)}
                      className="w-16 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="0"
                      min="0"
                      max="168"
                    />
                    <span className="text-sm text-slate-400">h</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={weeklyMinutesInput}
                      onChange={(e) => setWeeklyMinutesInput(e.target.value)}
                      className="w-16 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="0"
                      min="0"
                      max="59"
                    />
                    <span className="text-sm text-slate-400">m</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    const weeklyGoal = parseTimeInputs(weeklyHoursInput, weeklyMinutesInput);
                    onUpdateUser({ weeklyGoalHours: weeklyGoal });
                    setShowWeeklyGoalSettings(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowWeeklyGoalSettings(false);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Goal Settings Modal */}
      {showTotalGoalSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Total Goal Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Goal Hours
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={totalHoursInput}
                      onChange={(e) => setTotalHoursInput(e.target.value)}
                      className="w-20 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="0"
                      min="0"
                      max="9999"
                    />
                    <span className="text-sm text-slate-400">h</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={totalMinutesInput}
                      onChange={(e) => setTotalMinutesInput(e.target.value)}
                      className="w-16 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="0"
                      min="0"
                      max="59"
                    />
                    <span className="text-sm text-slate-400">m</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    const totalGoal = parseTimeInputs(totalHoursInput, totalMinutesInput);
                    onUpdateUser({ totalGoalHours: totalGoal });
                    setShowTotalGoalSettings(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowTotalGoalSettings(false);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};