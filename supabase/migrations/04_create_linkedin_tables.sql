-- Create LinkedIn profiles table
CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    person_urn TEXT NOT NULL,
    linkedin_member_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    access_token TEXT NOT NULL,
    access_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_token TEXT,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create LinkedIn posts table with scheduling support
CREATE TABLE IF NOT EXISTS public.linkedin_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linkedin_profile_id UUID NOT NULL REFERENCES public.linkedin_profiles(id) ON DELETE CASCADE,
    ugc_post_id TEXT, -- NULL for scheduled posts that haven't been published yet
    text TEXT NOT NULL,
    image_asset_urn TEXT,
    image_url TEXT,
    visibility TEXT NOT NULL CHECK (visibility IN ('PUBLIC', 'CONNECTIONS')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'scheduled', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE, -- NULL for immediate posts, set for scheduled posts
    published_at TIMESTAMP WITH TIME ZONE, -- When it was actually published to LinkedIn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_user_id ON public.linkedin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON public.linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON public.linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_scheduled_for ON public.linkedin_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_published_at ON public.linkedin_posts(published_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for linkedin_profiles
CREATE POLICY "Users can view own LinkedIn profiles" ON public.linkedin_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own LinkedIn profiles" ON public.linkedin_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LinkedIn profiles" ON public.linkedin_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own LinkedIn profiles" ON public.linkedin_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for linkedin_posts
CREATE POLICY "Users can view own LinkedIn posts" ON public.linkedin_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own LinkedIn posts" ON public.linkedin_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LinkedIn posts" ON public.linkedin_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own LinkedIn posts" ON public.linkedin_posts
    FOR DELETE USING (auth.uid() = user_id);
