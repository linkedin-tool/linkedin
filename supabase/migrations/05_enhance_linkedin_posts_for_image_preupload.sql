-- Enhance LinkedIn posts table to support image pre-upload workflow
-- This allows uploading images to LinkedIn immediately when scheduling posts
-- and storing the UGC Post ID/URN for later use when actually publishing

-- Add new columns to support the enhanced workflow
ALTER TABLE public.linkedin_posts 
ADD COLUMN IF NOT EXISTS image_upload_status TEXT DEFAULT 'pending' CHECK (image_upload_status IN ('pending', 'uploaded', 'failed')),
ADD COLUMN IF NOT EXISTS image_upload_error TEXT,
ADD COLUMN IF NOT EXISTS linkedin_image_urn TEXT, -- The LinkedIn URN for the uploaded image
ADD COLUMN IF NOT EXISTS image_file_size INTEGER,
ADD COLUMN IF NOT EXISTS image_file_type TEXT,
ADD COLUMN IF NOT EXISTS image_original_name TEXT;

-- Add index for image upload status for efficient querying
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_image_upload_status ON public.linkedin_posts(image_upload_status);

-- Add comments to document the new workflow
COMMENT ON COLUMN public.linkedin_posts.image_upload_status IS 'Status of image upload to LinkedIn: pending (not uploaded), uploaded (successfully uploaded), failed (upload failed)';
COMMENT ON COLUMN public.linkedin_posts.image_upload_error IS 'Error message if image upload to LinkedIn failed';
COMMENT ON COLUMN public.linkedin_posts.linkedin_image_urn IS 'LinkedIn URN for the uploaded image asset (urn:li:digitalmediaAsset:...)';
COMMENT ON COLUMN public.linkedin_posts.image_file_size IS 'Original file size in bytes';
COMMENT ON COLUMN public.linkedin_posts.image_file_type IS 'Original MIME type of the image';
COMMENT ON COLUMN public.linkedin_posts.image_original_name IS 'Original filename of the uploaded image';

-- Update existing records to have proper default values
UPDATE public.linkedin_posts 
SET image_upload_status = CASE 
    WHEN image_asset_urn IS NOT NULL THEN 'uploaded'
    WHEN image_url IS NOT NULL THEN 'pending'
    ELSE 'pending'
END
WHERE image_upload_status = 'pending';
