-- Supabase Schema for CAT Prep Buddy
-- Run this in your Supabase SQL Editor to set up the database tables

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT,
  email TEXT,
  dob DATE,
  work_experience INTEGER, -- In months
  field_of_study TEXT,
  target_percentile NUMERIC DEFAULT 99.0,
  daily_hours NUMERIC DEFAULT 3.0,
  strengths TEXT[] DEFAULT '{}'::TEXT[],
  weaknesses TEXT[] DEFAULT '{}'::TEXT[],
  exam_date DATE DEFAULT '2026-11-29'
);

-- Enable RLS for Profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);
CREATE POLICY "Allow users to insert own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Create Mocks History Table
CREATE TABLE IF NOT EXISTS public.user_mocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  exam_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  qa_score INTEGER,
  dilr_score INTEGER,
  varc_score INTEGER,
  total_score INTEGER NOT NULL,
  percentile NUMERIC,
  errors JSONB DEFAULT '{}'::jsonb,
  action_items TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Mocks
ALTER TABLE public.user_mocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own mocks" 
  ON public.user_mocks FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Create Error Notebook Table
CREATE TABLE IF NOT EXISTS public.user_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  section TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  question TEXT NOT NULL,
  your_answer TEXT,
  correct_answer TEXT NOT NULL,
  error_category TEXT NOT NULL,
  learning_point TEXT,
  resolved BOOLEAN DEFAULT false,
  date_added DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Errors
ALTER TABLE public.user_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own errors" 
  ON public.user_errors FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Create Syllabus Progress Table
CREATE TABLE IF NOT EXISTS public.user_syllabus_progress (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  subtopic TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, subtopic)
);

-- Enable RLS for Syllabus Progress
ALTER TABLE public.user_syllabus_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own syllabus progress" 
  ON public.user_syllabus_progress FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Create Syllabus Confidence Table
CREATE TABLE IF NOT EXISTS public.user_syllabus_confidence (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  subtopic TEXT NOT NULL,
  confidence TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, subtopic)
);

-- Enable RLS for Syllabus Confidence
ALTER TABLE public.user_syllabus_confidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own syllabus confidence" 
  ON public.user_syllabus_confidence FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
