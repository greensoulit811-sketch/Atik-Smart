
-- Allow admins to manage CAPI secrets directly from the client if needed
-- This serves as a fallback for when Edge Functions are not available
CREATE POLICY "Admins can manage CAPI secrets" ON public.capi_secrets
FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
