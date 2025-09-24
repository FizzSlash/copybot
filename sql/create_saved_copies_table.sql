-- Create table for storing finalized copy data
CREATE TABLE IF NOT EXISTS saved_copies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  client TEXT NOT NULL,
  send_date TEXT,
  subject_lines JSONB NOT NULL DEFAULT '[]',
  preview_text JSONB NOT NULL DEFAULT '[]',
  email_blocks JSONB NOT NULL DEFAULT '[]',
  selected_subject INTEGER DEFAULT 0,
  selected_preview INTEGER DEFAULT 0,
  airtable_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE saved_copies ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own saved copies
CREATE POLICY "Users can view their own saved copies"
  ON saved_copies FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own saved copies
CREATE POLICY "Users can insert their own saved copies"
  ON saved_copies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own saved copies
CREATE POLICY "Users can update their own saved copies"
  ON saved_copies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_copies_updated_at 
  BEFORE UPDATE ON saved_copies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();