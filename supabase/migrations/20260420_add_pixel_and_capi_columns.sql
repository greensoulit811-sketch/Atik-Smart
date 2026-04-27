-- ============================================================
-- Migration: Add Facebook Pixel + CAPI columns to site_settings
-- And create capi_secrets table
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Step 1: Add Facebook Pixel columns to site_settings (if not exists)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS fb_pixel_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fb_pixel_id text,
  ADD COLUMN IF NOT EXISTS fb_pixel_test_event_code text,
  ADD COLUMN IF NOT EXISTS cookie_consent_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fb_capi_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fb_capi_dataset_id text,
  ADD COLUMN IF NOT EXISTS fb_capi_test_event_code text,
  ADD COLUMN IF NOT EXISTS fb_capi_api_version text NOT NULL DEFAULT 'v20.0',
  ADD COLUMN IF NOT EXISTS show_stock_to_visitors boolean NOT NULL DEFAULT true;

-- Step 2: Create capi_secrets table (if not exists)
CREATE TABLE IF NOT EXISTS public.capi_secrets (
  id text PRIMARY KEY DEFAULT 'global',
  access_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Enable RLS on capi_secrets
ALTER TABLE public.capi_secrets ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for capi_secrets (drop existing first to avoid duplicates)
DROP POLICY IF EXISTS "Admins can manage CAPI secrets" ON public.capi_secrets;

CREATE POLICY "Admins can manage CAPI secrets"
  ON public.capi_secrets
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 5: Insert default row if not exists
INSERT INTO public.capi_secrets (id, access_token, updated_at)
VALUES ('global', NULL, now())
ON CONFLICT (id) DO NOTHING;

-- Done! Check the results:
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name LIKE 'fb_%'
ORDER BY column_name;
