import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { initFacebookPixel, trackPageView } from '@/lib/facebook-pixel';

// Cookie consent key
const CONSENT_KEY = 'fb_pixel_consent';

function hasConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

export function FacebookPixelProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();
  const location = useLocation();
  const initializedPixelIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>('');

  // Initialize pixel when settings are loaded
  useEffect(() => {
    // Don't load on admin routes
    if (location.pathname.startsWith('/admin')) return;

    // Check if pixel is enabled
    if (!settings.fb_pixel_enabled || !settings.fb_pixel_id) return;

    // Check consent if required
    if (settings.cookie_consent_enabled && !hasConsent()) return;

    // If already initialized with the SAME pixel ID, do nothing
    if (initializedPixelIdRef.current === settings.fb_pixel_id) return;

    try {
      const success = initFacebookPixel(
        settings.fb_pixel_id,
        settings.fb_pixel_test_event_code,
        settings.fb_capi_enabled || false
      );

      if (success) {
        initializedPixelIdRef.current = settings.fb_pixel_id;
        trackPageView();
        lastPathRef.current = location.pathname;
      }
    } catch (error) {
      console.warn('[FB Pixel Provider] Init error:', error);
    }
  }, [settings, location.pathname]);

  // Track page views on route change
  useEffect(() => {
    if (!initializedPixelIdRef.current) return;
    if (location.pathname.startsWith('/admin')) return;
    if (location.pathname === lastPathRef.current) return;

    lastPathRef.current = location.pathname;
    trackPageView();
  }, [location.pathname]);

  return <>{children}</>;
}

// Export consent functions for cookie banner
export function acceptCookieConsent(): void {
  localStorage.setItem(CONSENT_KEY, 'accepted');
  window.location.reload();
}

export function declineCookieConsent(): void {
  localStorage.setItem(CONSENT_KEY, 'declined');
}

export function getConsentStatus(): 'accepted' | 'declined' | null {
  const status = localStorage.getItem(CONSENT_KEY);
  if (status === 'accepted' || status === 'declined') return status;
  return null;
}
