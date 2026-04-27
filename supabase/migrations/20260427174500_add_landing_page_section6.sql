-- Add columns for section 6
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section6_title TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section6_subtitle TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
