/*
  # Initial Schema for English Learning App

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `avatar_url` (text)
      - `streak` (integer)
      - `max_streak` (integer)
      - `total_hours` (numeric)
      - `weekly_goal_hours` (numeric)
      - `total_goal_hours` (numeric)
      - `joined_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `shows`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `thumbnail_url` (text)
      - `platform` (text)
      - `level` (text)
      - `genre` (text[])
      - `total_duration` (integer)
      - `rating` (numeric)
      - `total_episodes` (integer)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `seasons`
      - `id` (uuid, primary key)
      - `show_id` (uuid, foreign key)
      - `number` (integer)
      - `title` (text)
      - `created_at` (timestamptz)

    - `episodes`
      - `id` (uuid, primary key)
      - `season_id` (uuid, foreign key)
      - `number` (integer)
      - `title` (text)
      - `duration` (integer)
      - `thumbnail_url` (text)
      - `video_url` (text)
      - `watched` (boolean)
      - `watch_count` (integer)
      - `passive_watch_count` (integer)
      - `active_watch_count` (integer)
      - `last_watched` (timestamptz)
      - `created_at` (timestamptz)

    - `flashcard_decks`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `card_count` (integer)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `flashcards`
      - `id` (uuid, primary key)
      - `deck_id` (uuid, foreign key)
      - `video_id` (text)
      - `video_title` (text)
      - `front` (text)
      - `back` (text)
      - `front_image_url` (text)
      - `back_image_url` (text)
      - `context` (text)
      - `timestamp` (integer)
      - `last_reviewed` (timestamptz)
      - `next_review` (timestamptz)
      - `ease_factor` (numeric)
      - `interval` (integer)
      - `repetitions` (integer)
      - `difficulty` (text)
      - `is_public` (boolean)
      - `likes` (integer)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `watch_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `video_id` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `duration` (integer)
      - `date` (date)
      - `flashcards_created` (integer)
      - `study_mode` (text)
      - `created_at` (timestamptz)

    - `manual_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `platform` (text)
      - `duration` (integer)
      - `date` (date)
      - `notes` (text)
      - `study_mode` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New User',
  avatar_url text,
  streak integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  total_hours numeric DEFAULT 0,
  weekly_goal_hours numeric DEFAULT 7,
  total_goal_hours numeric DEFAULT 1000,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  platform text NOT NULL,
  level text NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  genre text[] DEFAULT '{}',
  total_duration integer DEFAULT 0,
  rating numeric DEFAULT 0,
  total_episodes integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

-- Create episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text NOT NULL,
  duration integer NOT NULL,
  thumbnail_url text,
  video_url text,
  watched boolean DEFAULT false,
  watch_count integer DEFAULT 0,
  passive_watch_count integer DEFAULT 0,
  active_watch_count integer DEFAULT 0,
  last_watched timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create flashcard_decks table
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  card_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_title text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  front_image_url text,
  back_image_url text,
  context text,
  timestamp integer DEFAULT 0,
  last_reviewed timestamptz DEFAULT '1970-01-01'::timestamptz,
  next_review timestamptz DEFAULT now(),
  ease_factor numeric DEFAULT 2.5,
  interval integer DEFAULT 0,
  repetitions integer DEFAULT 0,
  difficulty text DEFAULT 'good' CHECK (difficulty IN ('again', 'hard', 'good', 'easy')),
  is_public boolean DEFAULT false,
  likes integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create watch_sessions table
CREATE TABLE IF NOT EXISTS watch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration integer NOT NULL,
  date date NOT NULL,
  flashcards_created integer DEFAULT 0,
  study_mode text NOT NULL CHECK (study_mode IN ('passive', 'active')),
  created_at timestamptz DEFAULT now()
);

-- Create manual_logs table
CREATE TABLE IF NOT EXISTS manual_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text NOT NULL,
  duration integer NOT NULL,
  date date NOT NULL,
  notes text,
  study_mode text NOT NULL CHECK (study_mode IN ('passive', 'active')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for shows table
CREATE POLICY "Users can read all shows"
  ON shows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create shows"
  ON shows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own shows"
  ON shows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own shows"
  ON shows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for seasons table
CREATE POLICY "Users can read all seasons"
  ON seasons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage seasons of own shows"
  ON seasons
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows 
    WHERE shows.id = seasons.show_id 
    AND shows.created_by = auth.uid()
  ));

-- Create policies for episodes table
CREATE POLICY "Users can read all episodes"
  ON episodes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage episodes of own shows"
  ON episodes
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM seasons 
    JOIN shows ON shows.id = seasons.show_id
    WHERE seasons.id = episodes.season_id 
    AND shows.created_by = auth.uid()
  ));

-- Create policies for flashcard_decks table
CREATE POLICY "Users can read own decks"
  ON flashcard_decks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create decks"
  ON flashcard_decks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own decks"
  ON flashcard_decks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own decks"
  ON flashcard_decks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for flashcards table
CREATE POLICY "Users can read own flashcards"
  ON flashcards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create flashcards"
  ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own flashcards"
  ON flashcards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for watch_sessions table
CREATE POLICY "Users can read own watch sessions"
  ON watch_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create watch sessions"
  ON watch_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch sessions"
  ON watch_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch sessions"
  ON watch_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for manual_logs table
CREATE POLICY "Users can read own manual logs"
  ON manual_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create manual logs"
  ON manual_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manual logs"
  ON manual_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manual logs"
  ON manual_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shows_created_by ON shows(created_by);
CREATE INDEX IF NOT EXISTS idx_seasons_show_id ON seasons(show_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_created_by ON flashcard_decks(created_by);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_created_by ON flashcards(created_by);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_user_id ON watch_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_date ON watch_sessions(date);
CREATE INDEX IF NOT EXISTS idx_manual_logs_user_id ON manual_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_logs_date ON manual_logs(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flashcard_decks_updated_at BEFORE UPDATE ON flashcard_decks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();