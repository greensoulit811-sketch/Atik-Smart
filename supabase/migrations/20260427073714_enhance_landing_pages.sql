ALTER TABLE public.landing_pages
ADD COLUMN video_url TEXT,
ADD COLUMN video_title TEXT DEFAULT 'Product Showcase',
ADD COLUMN features JSONB NOT NULL DEFAULT '[]',
ADD COLUMN benefits JSONB NOT NULL DEFAULT '[]',
ADD COLUMN trust_badges JSONB NOT NULL DEFAULT '[]',
ADD COLUMN accent_color TEXT DEFAULT '#ef4444',
ADD COLUMN secondary_cta_text TEXT DEFAULT 'Buy Now',
ADD COLUMN countdown_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN offer_text TEXT;

-- Update types for better DX if needed, but we'll handle it in TypeScript
