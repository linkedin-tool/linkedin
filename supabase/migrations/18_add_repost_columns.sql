-- Add columns to support repost functionality
ALTER TABLE linkedin_posts 
ADD COLUMN IF NOT EXISTS is_repost BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_post_urn TEXT;

-- Add index for better performance when querying reposts
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_is_repost ON linkedin_posts(is_repost);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_original_post_urn ON linkedin_posts(original_post_urn);

-- Add comment to explain the columns
COMMENT ON COLUMN linkedin_posts.is_repost IS 'Indicates if this post is a repost/reshare of another post';
COMMENT ON COLUMN linkedin_posts.original_post_urn IS 'URN of the original post if this is a repost';
