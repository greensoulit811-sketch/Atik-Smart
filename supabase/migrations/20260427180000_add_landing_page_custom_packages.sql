-- Add columns for custom packages in section 6
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section6_packages JSONB DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
