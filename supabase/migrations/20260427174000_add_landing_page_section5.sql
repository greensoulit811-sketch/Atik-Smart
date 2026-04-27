-- Add columns for section 5
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section5_image TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
