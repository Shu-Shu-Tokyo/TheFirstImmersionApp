import React, { useState, useRef } from 'react';
import { User, Camera, Save, X, Upload, LogOut } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase, uploadImage, STORAGE_BUCKETS, base64ToFile } from '../lib/supabase';

interface ProfileEditProps {
  user: UserType;
  onUpdateUser: (updates: Partial<UserType>) => void;
  onClose: () => void;
  onSignOut: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onUpdateUser, onClose, onSignOut }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    avatar: user.avatar,
    country: 'Japan',
    nativeLanguage: 'Japanese',
    targetLanguage: 'English',
    learningGoal: 'Improve conversation skills',
    bio: 'Passionate about learning English through immersion!',
    timezone: 'Asia/Tokyo',
    dailyGoalMinutes: 60
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countries = [
    'Japan', 'South Korea', 'China', 'Taiwan', 'Thailand', 'Vietnam',
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Spain', 'Italy', 'Brazil', 'Mexico', 'Other'
  ];

  const languages = [
    'Japanese', 'Korean', 'Chinese (Mandarin)', 'Chinese (Cantonese)',
    'Thai', 'Vietnamese', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Other'
  ];

  const targetLanguages = [
    'English', 'Japanese', 'Korean', 'Chinese (Mandarin)', 'Spanish',
    'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Other'
  ];

  const learningGoals = [
    'Improve conversation skills',
    'Prepare for business meetings',
    'Pass language exams (TOEFL, IELTS, etc.)',
    'Travel and tourism',
    'Academic studies',
    'Watch movies without subtitles',
    'Read books and articles',
    'General fluency',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    onUpdateUser(formData);
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const avatarUrl = await uploadImage(file, STORAGE_BUCKETS.AVATARS, fileName);

      if (avatarUrl) {
        handleInputChange('avatar', avatarUrl);
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('本当にログアウトしますか？');
    if (confirmed) {
      try {
        await onSignOut();
      } catch (error) {
        console.error('ログアウトエラー:', error);
      }
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <User className="w-6 h-6" />
            <span>プロフィール編集</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg font-medium transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              プロフィール画像
            </label>
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <img
                  src={formData.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNzQ3NDc0Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjYWFhYWFhIi8+CjxwYXRoIGQ9Ik0zMCAxMjBDMzAgMTA0IDUwIDkwIDc1IDkwUzEyMCAxMDQgMTIwIDEyMFYxNTBIMzBWMTIwWiIgZmlsbD0iI2FhYWFhYSIvPgo8L3N2Zz4K'}
                  alt="Current avatar"
                  className="w-20 h-20 rounded-full border-2 border-blue-500 object-cover"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white p-2 rounded-full transition-colors duration-200"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors duration-200"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'アップロード中...' : '画像をアップロード'}</span>
                </button>
                <p className="text-sm text-slate-400 mt-1">JPG, PNG, GIF (最大5MB)</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                表示名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="名前を入力"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                出身国
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Language Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                母国語
              </label>
              <select
                value={formData.nativeLanguage}
                onChange={(e) => handleInputChange('nativeLanguage', e.target.value)}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                学習言語
              </label>
              <select
                value={formData.targetLanguage}
                onChange={(e) => handleInputChange('targetLanguage', e.target.value)}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {targetLanguages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              学習目標
            </label>
            <select
              value={formData.learningGoal}
              onChange={(e) => handleInputChange('learningGoal', e.target.value)}
              className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {learningGoals.map(goal => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              1日の学習目標（分）
            </label>
            <input
              type="number"
              value={formData.dailyGoalMinutes}
              onChange={(e) => handleInputChange('dailyGoalMinutes', parseInt(e.target.value) || 0)}
              min="5"
              max="480"
              className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="60"
            />
            <p className="text-xs text-slate-400 mt-1">
              推奨: 1日30-120分
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              自己紹介
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="学習の動機や目標について教えてください..."
            />
          </div>

          {/* Current Stats Display */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
              <span>現在の進捗</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-green-400">{user.streak}</p>
                <p className="text-xs text-slate-400">連続日数</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-400">{user.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-slate-400">総学習時間</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>変更を保存</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              キャンセル
            </button>
          </div>

          {/* Logout Button */}
          <div className="pt-6 border-t border-slate-600">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};