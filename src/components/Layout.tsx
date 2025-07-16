import React from 'react';
import { BookOpen, Calendar, Brain, BarChart3, Library, PlusCircle, Plus } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  user: any;
  onEditProfile: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, user, onEditProfile }) => {
  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'activity', icon: Calendar, label: 'Activity' },
    { id: 'flashcards', icon: Brain, label: 'Flashcards' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'content-manager', icon: PlusCircle, label: 'Content Manager' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ImmersionFlow</h1>
                <p className="text-xs text-slate-300">Master English Through Daily Immersion</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-300">{user.streak} day streak 🔥</p>
              </div>
              <button onClick={onEditProfile}>
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-lg hover:border-blue-400 transition-colors duration-200"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-slate-800/50 border-r border-slate-700 min-h-screen p-4 hidden lg:block">
          <div className="space-y-2">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentView === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Hours</span>
                <span className="text-white font-medium">{Math.floor(user.totalHours)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Streak</span>
                <span className="text-white font-medium">{user.streak} days</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50">
          <div className="flex justify-around py-2">
            {navItems.slice(0, 5).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  currentView === id
                    ? 'text-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};