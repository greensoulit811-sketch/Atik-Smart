-- Add columns for section 4
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section4_title TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section4_subtitle TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section4_image TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section4_cta_text TEXT DEFAULT 'অর্ডার করতে চাই';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
