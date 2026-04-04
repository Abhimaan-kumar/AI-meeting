-- AI Meeting-to-Action System Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  avatar TEXT,
  location VARCHAR(255),
  bio TEXT,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ==================== MEETINGS TABLE ====================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'in-progress', 'scheduled')),
  summary TEXT,
  transcript TEXT,
  location VARCHAR(255),
  recording_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own meetings
CREATE POLICY "Users can view their own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
  ON meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_status ON meetings(status);

-- ==================== MEETING PARTICIPANTS TABLE ====================
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255),
  role VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Users can access participants of their own meetings
CREATE POLICY "Users can view participants of their meetings"
  ON meeting_participants FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to their meetings"
  ON meeting_participants FOR INSERT
  WITH CHECK (
    meeting_id IN (
      SELECT id FROM meetings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete participants from their meetings"
  ON meeting_participants FOR DELETE
  USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE user_id = auth.uid()
    )
  );

-- Create index
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

-- ==================== ACTION ITEMS TABLE ====================
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignee VARCHAR(255) NOT NULL,
  due_date DATE NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'in_progress', 'todo')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own action items
CREATE POLICY "Users can view their own action items"
  ON action_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action items"
  ON action_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items"
  ON action_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items"
  ON action_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_action_items_user_id ON action_items(user_id);
CREATE INDEX idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('action', 'meeting', 'mention', 'alert', 'info')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ==================== USER SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  compact_mode BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  slack_notifications BOOLEAN DEFAULT FALSE,
  slack_webhook TEXT,
  calendar_sync BOOLEAN DEFAULT FALSE,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  outlook_calendar_connected BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ==================== STORAGE BUCKETS ====================
-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== SAMPLE DATA (Optional for testing) ====================

-- Insert sample user (only if running in development)
-- Note: This requires a user to be created via Supabase Auth first
-- You can uncomment and modify the UUID to match your test user

/*
INSERT INTO users (id, email, name, role, department, location, bio, join_date)
VALUES (
  'YOUR-USER-UUID-HERE',
  'demo@example.com',
  'Demo User',
  'Product Manager',
  'Product',
  'San Francisco, CA',
  'Passionate about building great products and leading teams.',
  CURRENT_DATE
);

INSERT INTO user_settings (user_id)
VALUES ('YOUR-USER-UUID-HERE');
*/

-- ==================== VIEWS FOR ANALYTICS ====================

-- View for meeting statistics
CREATE OR REPLACE VIEW meeting_stats AS
SELECT
  user_id,
  COUNT(*) as total_meetings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_meetings,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_meetings,
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_meetings
FROM meetings
GROUP BY user_id;

-- View for action item statistics
CREATE OR REPLACE VIEW action_item_stats AS
SELECT
  user_id,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_actions,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_actions,
  COUNT(*) FILTER (WHERE status = 'todo') as todo_actions,
  AVG(CASE WHEN status = 'completed' THEN 100 ELSE progress END) as avg_completion_rate
FROM action_items
GROUP BY user_id;

-- Grant access to views
GRANT SELECT ON meeting_stats TO authenticated;
GRANT SELECT ON action_item_stats TO authenticated;

-- ==================== COMPLETION ====================
-- Schema setup complete!
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Configure environment variables in .env file
-- 3. Update Supabase project settings for email confirmations
