-- Add AI suggestions column to ideas table
ALTER TABLE public.ideas 
ADD COLUMN ai_suggestions JSONB DEFAULT NULL;

-- Add index for better performance when querying ideas with suggestions
CREATE INDEX IF NOT EXISTS idx_ideas_ai_suggestions ON public.ideas USING GIN (ai_suggestions);

-- Add comment to explain the column structure
COMMENT ON COLUMN public.ideas.ai_suggestions IS 'JSON array containing AI-generated improvement suggestions for the idea. Each suggestion has a title and description.';
