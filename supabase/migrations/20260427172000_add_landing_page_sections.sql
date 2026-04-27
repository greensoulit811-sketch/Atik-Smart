-- Add columns for section 2 and 3 if they don't exist
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_title TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_subtitle TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_image TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_badge TEXT DEFAULT 'Premium Formula';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_cta_text TEXT DEFAULT 'অর্ডার করতে চাই';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_phone_text TEXT DEFAULT 'সরাসরি কল করুন';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section2_overlay_text TEXT DEFAULT 'বীর্য/পাত ভয়\nআর নয়';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section3_title TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.landing_pages ADD COLUMN section3_badge TEXT DEFAULT 'উপকারিতা';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
