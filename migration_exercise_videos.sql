-- Migration: Add optional demonstration video columns to exercises table

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_thumbnail_url text DEFAULT NULL;

COMMENT ON COLUMN exercises.video_url IS 'Bunny.net or cloud CDN URL for exercise form demonstration video (MP4 or HLS .m3u8)';
COMMENT ON COLUMN exercises.video_thumbnail_url IS 'Optional URL for poster/thumbnail preview image of the video';
