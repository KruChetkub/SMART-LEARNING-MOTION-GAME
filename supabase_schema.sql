-- Database Schema for Smart Math Motion Game
-- Run this script in the Supabase SQL Editor to set up the database tables

-- Create ENUM for user roles if not exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(150),
    avatar_url TEXT,
    email TEXT,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create public.user_settings table for camera and sound configurations
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    camera_rotation INTEGER DEFAULT 0 NOT NULL,
    mirror_horizontal BOOLEAN DEFAULT true NOT NULL,
    virtual_camera_output BOOLEAN DEFAULT false NOT NULL,
    sound_enabled BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create public.questions table for dynamic subject question banks
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(50) NOT NULL, -- e.g., 'Mathematics', 'Thai', 'English'
    category VARCHAR(50) NOT NULL, -- e.g., 'addition', 'vowels', 'vocabulary'
    equation TEXT NOT NULL,       -- e.g., 'What color is the sky?' or 'สระ "อา" เขียนอย่างไร?'
    choices TEXT[] NOT NULL,      -- e.g., ARRAY['Red', 'Green', 'Blue', 'Yellow']
    answer_index INTEGER NOT NULL, -- 0 to 3
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: choices array must contain exactly 4 elements
    CONSTRAINT check_four_choices CHECK (cardinality(choices) = 4),
    
    -- Constraint: answer_index must be within choices bounds (0 to 3)
    CONSTRAINT check_answer_index CHECK (answer_index >= 0 AND answer_index <= 3),
    
    -- Constraint: all choices must be unique (no duplicates in array)
    CONSTRAINT check_unique_choices CHECK (
        choices[1] <> choices[2] AND 
        choices[1] <> choices[3] AND 
        choices[1] <> choices[4] AND 
        choices[2] <> choices[3] AND 
        choices[2] <> choices[4] AND 
        choices[3] <> choices[4]
    )
);

-- Create public.game_settings table for dynamic session controls
CREATE TABLE IF NOT EXISTS public.game_settings (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(50) UNIQUE NOT NULL, -- Settings per subject, or use 'default'
    time_limit INTEGER DEFAULT 15 NOT NULL, -- seconds (15, 30, 60)
    questions_per_game INTEGER DEFAULT 5 NOT NULL, -- questions (5, 10, 20)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    time_used INTEGER NOT NULL,
    earned_badge VARCHAR(50) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    max_combo INTEGER NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    player_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure user_id column exists if tables were already created previously without it
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is admin or superadmin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role IN ('admin'::public.user_role, 'superadmin'::public.user_role)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin manage profiles" ON public.profiles FOR ALL USING (public.is_admin(auth.uid()));

-- User Settings Policies
CREATE POLICY "Allow users access own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Questions Policies
CREATE POLICY "Allow public select on questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow admin manage questions" ON public.questions FOR ALL USING (public.is_admin(auth.uid()));

-- Game Settings Policies
CREATE POLICY "Allow public select on game_settings" ON public.game_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage game_settings" ON public.game_settings FOR ALL USING (public.is_admin(auth.uid()));

-- Game Sessions Policies
CREATE POLICY "Allow public select on game_sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert own game_sessions" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow admin manage game_sessions" ON public.game_sessions FOR ALL USING (public.is_admin(auth.uid()));

-- Leaderboard Policies
CREATE POLICY "Allow public select on leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert own leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow admin manage leaderboard" ON public.leaderboard FOR ALL USING (public.is_admin(auth.uid()));

-- Create profile automatic creation function on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'ผู้เล่นใหม่'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        new.email,
        'user'::public.user_role
    )
    ON CONFLICT (id) DO UPDATE
    SET
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handle_new_user
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default configurations
INSERT INTO public.game_settings (subject, time_limit, questions_per_game)
VALUES 
    ('Mathematics', 15, 5),
    ('Thai', 15, 5),
    ('English', 15, 5)
ON CONFLICT (subject) DO NOTHING;

-- Phase 7: EXP, Level, and Rank systems
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank_tier VARCHAR(50) DEFAULT 'Bronze III' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank_stars INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_in_promotion BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promotion_quest_type VARCHAR(50) DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promotion_quest_target INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promotion_quest_progress INTEGER DEFAULT 0 NOT NULL;

-- Function to soft-reset ranks for all users (e.g. at season/monthly reset)
CREATE OR REPLACE FUNCTION public.reset_monthly_ranks()
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        rank_tier = CASE
            WHEN rank_tier = 'Conqueror' THEN 'Diamond III'
            WHEN rank_tier LIKE 'Diamond%' THEN 'Gold I'
            WHEN rank_tier LIKE 'Platinum%' THEN 'Silver I'
            WHEN rank_tier LIKE 'Gold%' THEN 'Silver I'
            WHEN rank_tier LIKE 'Silver%' THEN 'Bronze I'
            ELSE 'Bronze III'
        END,
        rank_stars = 0,
        is_in_promotion = false,
        promotion_quest_type = null,
        promotion_quest_target = 0,
        promotion_quest_progress = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grade Level extension
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20) DEFAULT 'P1' NOT NULL;

ALTER TABLE public.game_settings DROP CONSTRAINT IF EXISTS game_settings_subject_key;
ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20) DEFAULT 'All' NOT NULL;
ALTER TABLE public.game_settings ADD CONSTRAINT game_settings_subject_grade_key UNIQUE (subject, grade_level);

