import { useState } from 'react';
import { 
  useLandingPages, 
  useCreateLandingPage, 
  useUpdateLandingPage, 
  useDeleteLandingPage, 
  LandingPage, 
  HowToUseCard,
  Feature,
  Benefit,
  TrustBadge
} from '@/hooks/useLandingPages';
import { useProducts } from '@/hooks/useShopData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ExternalLink, X, Copy, Palette, Video, ListChecks, ShieldCheck, Timer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const emptyForm = (): Omit<LandingPage, 'id' | 'created_at' | 'updated_at'> => ({
  title: '',
  slug: '',
  is_active: true,
  hero_title: '',
  hero_subtitle: '',
  hero_image: '',
  hero_cta_text: 'Order Now',
  product_ids: [],
  how_to_use_cards: [],
  show_reviews: true,
  video_url: '',
  video_title: 'Product Showcase',
  features: [],
  benefits: [],
  trust_badges: [],
  accent_color: '#ef4444',
  secondary_cta_text: 'Buy Now',
  countdown_end_date: null,
  offer_text: '',
});

export default function AdminLandingPages() {
  const { data: pages = [], isLoading } = useLandingPages();
  const { data: allProducts = [] } = useProducts();
  const createPage = useCreateLandingPage();
  const updatePage = useUpdateLandingPage();
  const deletePage = useDeleteLandingPage();

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setIsOpen(true);
  };

  const openEdit = (p: LandingPage) => {
    setEditId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      is_active: p.is_active,
      hero_title: p.hero_title,
      hero_subtitle: p.hero_subtitle || '',
      hero_image: p.hero_image || '',
      hero_cta_text: p.hero_cta_text,
      product_ids: p.product_ids || [],
      how_to_use_cards: p.how_to_use_cards || [],
      show_reviews: p.show_reviews,
      video_url: p.video_url || '',
      video_title: p.video_title || 'Product Showcase',
      features: p.features || [],
      benefits: p.benefits || [],
      trust_badges: p.trust_badges || [],
      accent_color: p.accent_color || '#ef4444',
      secondary_cta_text: p.secondary_cta_text || 'Buy Now',
      countdown_end_date: p.countdown_end_date,
      offer_text: p.offer_text || '',
    });
    setIsOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: editId ? prev.slug : generateSlug(title),
    }));
  };

  const toggleProduct = (id: string) => {
    setForm(prev => {
      const ids = prev.product_ids.includes(id)
        ? prev.product_ids.filter(p => p !== id)
        : prev.product_ids.length < 5
          ? [...prev.product_ids, id]
          : prev.product_ids;
      if (!prev.product_ids.includes(id) && prev.product_ids.length >= 5) {
        toast.error('Maximum 5 products allowed');
      }
      return { ...prev, product_ids: ids };
    });
  };

  // List Management Helpers
  const addListItem = <T,>(field: keyof typeof form, item: T) => {
    setForm(prev => ({
      ...prev,
      [field]: [...(prev[field] as T[]), item],
    }));
  };

  const updateListItem = <T,>(field: keyof typeof form, index: number, value: Partial<T>) => {
    setForm(prev => {
      const items = [...(prev[field] as T[])];
      items[index] = { ...items[index], ...value };
      return { ...prev, [field]: items };
    });
  };

  const removeListItem = (field: keyof typeof form, index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.hero_title.trim()) {
      toast.error('Title and Hero Title are required');
      return;
    }
    if (form.product_ids.length === 0) {
      toast.error('Select at least one product');
      return;
    }

    if (editId) {
      await updatePage.mutateAsync({ id: editId, ...form });
    } else {
      await createPage.mutateAsync(form);
    }
    setIsOpen(false);
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/lp/${slug}`);
    toast.success('URL copied');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <Button onClick={openCreate} className="btn-accent">
          <Plus className="h-4 w-4 mr-2" /> Create Landing Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No landing pages yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => (
            <div key={page.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {page.hero_image && (
                <img src={page.hero_image} alt="" className="w-20 h-14 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{page.title}</h3>
                  <Badge variant={page.is_active ? 'default' : 'secondary'}>
                    {page.is_active ? 'Active' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">/lp/{page.slug} • {page.product_ids.length} products</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => copyUrl(page.slug)} title="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={`/lp/${page.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                </a>
                <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{page.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePage.mutate(page.id)} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit' : 'Create'} Landing Page</DialogTitle>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* 1. Basic Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Palette className="h-5 w-5 text-accent" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Basic & Branding</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Page Title *</label>
                  <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. Summer Sunglass Deal" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug</label>
                  <Input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">/lp/{form.slug || '...'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Accent Color</label>
                  <div className="flex gap-2">
                    <Input type="color" value={form.accent_color || '#ef4444'} onChange={e => setForm(prev => ({ ...prev, accent_color: e.target.value }))} className="w-12 p-1 h-10" />
                    <Input value={form.accent_color || ''} onChange={e => setForm(prev => ({ ...prev, accent_color: e.target.value }))} placeholder="#ef4444" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Promo Offer Text</label>
                  <Input value={form.offer_text || ''} onChange={e => setForm(prev => ({ ...prev, offer_text: e.target.value }))} placeholder="e.g. 50% OFF TODAY ONLY" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(prev => ({ ...prev, is_active: v }))} />
                <span className="text-sm font-medium">Active (Visible to users)</span>
              </div>
            </section>

            {/* 2. Hero Section */}
            <section className="space-y-4 bg-secondary/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 border-b pb-2">
                <Palette className="h-5 w-5 text-accent" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Hero Section</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hero Title *</label>
                  <Input value={form.hero_title} onChange={e => setForm(prev => ({ ...prev, hero_title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hero Subtitle</label>
                  <textarea value={form.hero_subtitle || ''} onChange={e => setForm(prev => ({ ...prev, hero_subtitle: e.target.value }))} className="input-shop min-h-[80px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Main Hero Image</label>
                    <ImageUpload value={form.hero_image || ''} onChange={v => setForm(prev => ({ ...prev, hero_image: v }))} folder="landing-pages" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CTA Button Text</label>
                      <Input value={form.hero_cta_text} onChange={e => setForm(prev => ({ ...prev, hero_cta_text: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary CTA Text</label>
                      <Input value={form.secondary_cta_text || ''} onChange={e => setForm(prev => ({ ...prev, secondary_cta_text: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Video Showcase */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Video className="h-5 w-5 text-accent" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Video Showcase</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video URL (YouTube/Direct)</label>
                  <Input value={form.video_url || ''} onChange={e => setForm(prev => ({ ...prev, video_url: e.target.value }))} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Section Title</label>
                  <Input value={form.video_title || ''} onChange={e => setForm(prev => ({ ...prev, video_title: e.target.value }))} />
                </div>
              </div>
            </section>

            {/* 4. Features & Benefits */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Features</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addListItem<Feature>('features', { image: '', title: '', description: '' })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.features.map((item, i) => (
                    <div key={i} className="border p-4 rounded-lg space-y-3 relative bg-secondary/5">
                      <button onClick={() => removeListItem('features', i)} className="absolute top-2 right-2 text-destructive"><X className="h-4 w-4" /></button>
                      <ImageUpload value={item.image} onChange={v => updateListItem<Feature>('features', i, { image: v })} folder="landing-pages" />
                      <Input value={item.title} onChange={e => updateListItem<Feature>('features', i, { title: e.target.value })} placeholder="Celebrity Name / Feature Title" />
                      <textarea value={item.description} onChange={e => updateListItem<Feature>('features', i, { description: e.target.value })} className="input-shop min-h-[60px] text-xs" placeholder="Short description (optional)" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Benefits List</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addListItem<Benefit>('benefits', { text: '' })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.benefits.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={item.text} onChange={e => updateListItem<Benefit>('benefits', i, { text: e.target.value })} placeholder="e.g. Free Shipping Nationwide" />
                      <Button variant="ghost" size="icon" onClick={() => removeListItem('benefits', i)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 5. Trust Badges */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold uppercase text-sm tracking-wider">Trust Badges</h3>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem<TrustBadge>('trust_badges', { image: '', text: '' })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Badge
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {form.trust_badges.map((badge, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                    <button onClick={() => removeListItem('trust_badges', i)} className="absolute top-2 right-2 text-destructive"><X className="h-4 w-4" /></button>
                    <ImageUpload value={badge.image} onChange={v => updateListItem<TrustBadge>('trust_badges', i, { image: v })} folder="landing-pages" />
                    <Input value={badge.text} onChange={e => updateListItem<TrustBadge>('trust_badges', i, { text: e.target.value })} placeholder="Badge Label" />
                  </div>
                ))}
              </div>
            </section>

            {/* 6. Products */}
            <section className="space-y-4 bg-secondary/20 p-4 rounded-xl">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase border-b pb-2">Products (max 5)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3 bg-card">
                {allProducts.map(product => (
                  <label key={product.id} className={`flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${form.product_ids.includes(product.id) ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-transparent hover:bg-secondary'}`}>
                    <div className="relative">
                      <input type="checkbox" checked={form.product_ids.includes(product.id)} onChange={() => toggleProduct(product.id)} className="absolute top-1 left-1 w-4 h-4 z-10" />
                      <img src={product.images?.[0]} alt="" className="w-16 h-16 rounded object-cover" />
                    </div>
                    <span className="text-[10px] text-center line-clamp-1">{product.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium">{form.product_ids.length}/5 selected</p>
            </section>

            {/* 7. How to Use */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Step-by-Step Guide</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem<HowToUseCard>('how_to_use_cards', { image: '', title: '', description: '' })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Step
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.how_to_use_cards.map((card, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative bg-secondary/5">
                    <button type="button" onClick={() => removeListItem('how_to_use_cards', i)} className="absolute top-2 right-2 text-destructive"><X className="h-4 w-4" /></button>
                    <div className="grid grid-cols-1 gap-3">
                      <ImageUpload value={card.image} onChange={v => updateListItem<HowToUseCard>('how_to_use_cards', i, { image: v })} folder="landing-pages" />
                      <Input value={card.title} onChange={e => updateListItem<HowToUseCard>('how_to_use_cards', i, { title: e.target.value })} placeholder="Step Title" />
                      <textarea value={card.description} onChange={e => updateListItem<HowToUseCard>('how_to_use_cards', i, { description: e.target.value })} className="input-shop min-h-[60px]" placeholder="Instruction..." />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. Urgency & Social Proof */}
            <section className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Urgency Timer</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Countdown End Date</label>
                    <Input type="datetime-local" value={form.countdown_end_date ? new Date(form.countdown_end_date).toISOString().slice(0, 16) : ''} onChange={e => setForm(prev => ({ ...prev, countdown_end_date: e.target.value || null }))} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Social Proof</h3>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg">
                    <Switch checked={form.show_reviews} onCheckedChange={v => setForm(prev => ({ ...prev, show_reviews: v }))} />
                    <span className="text-sm font-medium">Show Customer Reviews Section</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 pt-4 bg-background border-t">
              <Button onClick={handleSave} size="lg" className="btn-accent w-full text-lg py-6 shadow-lg shadow-accent/20" disabled={createPage.isPending || updatePage.isPending}>
                {editId ? 'Save Changes' : 'Launch Landing Page'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

