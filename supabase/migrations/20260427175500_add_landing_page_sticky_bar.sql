-- Add columns for sticky bar in section 6
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section6_show_sticky_bar BOOLEAN DEFAULT TRUE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section6_sticky_text TEXT DEFAULT 'সীমিত সময়ের জন্য ফ্রি ডেলিভারি!';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section6_sticky_countdown TEXT DEFAULT '01:10:37';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
