import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HowToUseCard {
  image: string;
  title: string;
  description: string;
}

export interface Feature {
  image: string;
  title: string;
  description: string;
}

export interface Benefit {
  text: string;
}

export interface TrustBadge {
  image: string;
  text: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image: string | null;
  hero_cta_text: string;
  product_ids: string[];
  how_to_use_cards: HowToUseCard[];
  show_reviews: boolean;
  video_url: string | null;
  video_title: string | null;
  features: Feature[];
  benefits: Benefit[];
  trust_badges: TrustBadge[];
  accent_color: string | null;
  secondary_cta_text: string | null;
  countdown_end_date: string | null;
  offer_text: string | null;
  section2_title: string | null;
  section2_subtitle: string | null;
  section2_image: string | null;
  section2_badge: string | null;
  section2_cta_text: string | null;
  section2_phone_text: string | null;
  section2_overlay_text: string | null;
  section3_title: string | null;
  section3_badge: string | null;
  section4_title: string | null;
  section4_subtitle: string | null;
  section4_image: string | null;
  section4_cta_text: string | null;
  section5_image: string | null;
  section6_title: string | null;
  section6_subtitle: string | null;
  section6_show_sticky_bar: boolean;
  section6_sticky_text: string | null;
  section6_sticky_countdown: string | null;
  section6_packages: any[];
  created_at: string;
  updated_at: string;
}

const mapLandingPage = (d: any): LandingPage => ({
  ...d,
  how_to_use_cards: (d.how_to_use_cards as any) || [],
  features: (d.features as any) || [],
  benefits: (d.benefits as any) || [],
  trust_badges: (d.trust_badges as any) || [],
  accent_color: d.accent_color || '#ef4444',
  video_title: d.video_title || 'Product Showcase',
  secondary_cta_text: d.secondary_cta_text || 'Buy Now',
  video_url: d.video_url || null,
  countdown_end_date: d.countdown_end_date || null,
  offer_text: d.offer_text || null,
  section2_title: d.section2_title || null,
  section2_subtitle: d.section2_subtitle || null,
  section2_image: d.section2_image || null,
  section2_badge: d.section2_badge || 'Premium Formula',
  section2_cta_text: d.section2_cta_text || 'অর্ডার করতে চাই',
  section2_phone_text: d.section2_phone_text || 'সরাসরি কল করুন',
  section2_overlay_text: d.section2_overlay_text || 'বীর্য/পাত ভয়\nআর নয়',
  section3_title: d.section3_title || null,
  section3_badge: d.section3_badge || 'উপকারিতা',
  section4_title: d.section4_title || null,
  section4_subtitle: d.section4_subtitle || null,
  section4_image: d.section4_image || null,
  section4_cta_text: d.section4_cta_text || 'অর্ডার করতে চাই',
  section5_image: d.section5_image || null,
  section6_title: d.section6_title || null,
  section6_subtitle: d.section6_subtitle || null,
  section6_show_sticky_bar: d.section6_show_sticky_bar ?? true,
  section6_sticky_text: d.section6_sticky_text || 'সীমিত সময়ের জন্য ফ্রি ডেলিভারি!',
  section6_sticky_countdown: d.section6_sticky_countdown || '01:10:37',
  section6_packages: d.section6_packages || [],
});

export const useLandingPages = () => {
  return useQuery({
    queryKey: ['landing_pages'],
    queryFn: async () => {
      // Explicitly select columns to avoid errors if some are missing in DB
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapLandingPage);
    },
  });
};

export const useLandingPage = (slug: string) => {
  return useQuery({
    queryKey: ['landing_page', slug],
    queryFn: async () => {
      // Explicitly select columns to avoid errors if some are missing in DB
      // Note: Add new columns to this list once migration is applied
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapLandingPage(data);
    },
    enabled: !!slug,
  });
};


export const useCreateLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          ...page,
          how_to_use_cards: JSON.parse(JSON.stringify(page.how_to_use_cards)),
          features: JSON.parse(JSON.stringify(page.features)),
          benefits: JSON.parse(JSON.stringify(page.benefits)),
          trust_badges: JSON.parse(JSON.stringify(page.trust_badges)),
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page created');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};

export const useUpdateLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...page }: Partial<LandingPage> & { id: string }) => {
      const payload: any = { ...page };
      if (page.how_to_use_cards) payload.how_to_use_cards = JSON.parse(JSON.stringify(page.how_to_use_cards));
      if (page.features) payload.features = JSON.parse(JSON.stringify(page.features));
      if (page.benefits) payload.benefits = JSON.parse(JSON.stringify(page.benefits));
      if (page.trust_badges) payload.trust_badges = JSON.parse(JSON.stringify(page.trust_badges));
      
      const { data, error } = await supabase
        .from('landing_pages')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page updated');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};

export const useDeleteLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page deleted');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};
