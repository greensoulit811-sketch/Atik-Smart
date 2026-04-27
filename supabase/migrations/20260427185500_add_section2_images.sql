-- Add section2_images column to landing_pages table
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS section2_images JSONB DEFAULT '[]';
