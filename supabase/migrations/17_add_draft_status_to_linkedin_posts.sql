-- Add 'draft' status to LinkedIn posts table
-- This allows users to save posts as drafts without scheduling or publishing them

-- First, drop the existing constraint
ALTER TABLE public.linkedin_posts 
DROP CONSTRAINT IF EXISTS linkedin_posts_status_check;

-- Add the new constraint with 'draft' status included
ALTER TABLE public.linkedin_posts 
ADD CONSTRAINT linkedin_posts_status_check 
CHECK (status IN ('published', 'scheduled', 'failed', 'draft'));

-- Update the default status to 'draft' for new posts
-- This ensures posts start as drafts unless explicitly published or scheduled
ALTER TABLE public.linkedin_posts 
ALTER COLUMN status SET DEFAULT 'draft';

-- Add comment to document the new status
COMMENT ON COLUMN public.linkedin_posts.status IS 'Post status: draft (saved but not scheduled), scheduled (planned for future publishing), published (live on LinkedIn), failed (publishing failed)';

-- Add index for draft status for efficient querying
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status_draft ON public.linkedin_posts(status) WHERE status = 'draft';
