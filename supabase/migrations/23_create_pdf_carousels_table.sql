-- Create PDF carousels table for storing generated LinkedIn carousel PDFs
CREATE TABLE IF NOT EXISTS pdf_carousels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    slide_count INTEGER NOT NULL DEFAULT 1,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_pdf_carousels_user_id ON pdf_carousels(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_carousels_created_at ON pdf_carousels(created_at DESC);

-- Enable RLS
ALTER TABLE pdf_carousels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own PDF carousels" ON pdf_carousels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF carousels" ON pdf_carousels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF carousels" ON pdf_carousels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF carousels" ON pdf_carousels
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-carousels', 'pdf-carousels', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own PDF carousels" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pdf-carousels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own PDF carousels" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'pdf-carousels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own PDF carousels" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pdf-carousels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own PDF carousels" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pdf-carousels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow public access to PDF files (for LinkedIn sharing)
CREATE POLICY "Public can view PDF carousels" ON storage.objects
    FOR SELECT USING (bucket_id = 'pdf-carousels');
