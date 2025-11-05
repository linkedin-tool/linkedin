-- Create ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('voice', 'text', 'image')),
    image_url TEXT, -- For image type ideas
    original_audio_url TEXT, -- For voice type ideas (original recording)
    transcribed_text TEXT, -- For voice type ideas (transcribed and cleaned text)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_type ON public.ideas(type);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ideas
CREATE POLICY "Users can view own ideas" ON public.ideas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas" ON public.ideas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas" ON public.ideas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas" ON public.ideas
    FOR DELETE USING (auth.uid() = user_id);
