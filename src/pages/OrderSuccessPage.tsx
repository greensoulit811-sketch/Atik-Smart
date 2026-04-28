import { useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, User, ShoppingBag, Search } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { useOrderByNumber } from '@/hooks/useOrders';
import { trackPurchase } from '@/lib/facebook-pixel';
import { toast } from 'sonner';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = searchParams.get('orderId') || 'N/A';
  const { t, settings } = useSiteSettings();
  const { data: order } = useOrderByNumber(orderId);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;

    // Try to get data from navigation state first (immediate, no RLS issues)
    if (location.state && location.state.total !== undefined) {
      console.log('[OrderSuccess] Tracking Purchase from state:', location.state);
      trackPurchase({
        orderId: orderId,
        value: location.state.total,
        currency: location.state.currency || settings.currency_code || 'BDT',
        contents: location.state.items.map((item: any) => ({
          id: item.id || 'unknown',
          quantity: item.quantity || 1,
          item_price: item.price || 0
        })),
        email: location.state.customer_email || undefined,
        phone: location.state.customer_phone || undefined
      });
      trackedRef.current = true;
      toast.success(`Facebook Purchase Event Fired! (Order: ${orderId})`);
    }
    // Fallback to fetched order if no state (e.g. page refresh)
    else if (order) {
      trackPurchase({
        orderId: order.order_number,
        value: order.total,
        currency: settings.currency_code || 'BDT',
        contents: order.order_items?.map(item => ({
          id: item.product_id || 'unknown',
          quantity: item.quantity,
          item_price: item.price
        })) || [],
        email: order.customer_email || undefined,
        phone: order.customer_phone
      });
      trackedRef.current = true;
    }
  }, [order, location.state, orderId, settings.currency_code]);

  return (
    <div className="min-h-screen bg-white">
      {/* --- Header --- */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex-1 flex gap-6 text-[11px] font-bold uppercase tracking-widest hidden lg:flex">
            <a href="/" className="hover:opacity-50 transition-opacity">Home</a>
            <a href="/about" className="hover:opacity-50 transition-opacity">About</a>
          </div>

          <div className="flex-1 flex justify-center">
            <span className="text-2xl font-black font-serif uppercase tracking-tight leading-none text-center">
              {settings?.site_name?.split(' ').map((word, i) => (
                <span key={i} className={i % 2 !== 0 ? 'italic font-normal' : ''}>{word} </span>
              ))}
            </span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-6">
            <button className="hover:scale-110 transition-transform" onClick={() => navigate('/admin/login')}>
              <User className="h-5 w-5 stroke-[1.5px]" />
            </button>
            <button className="hover:scale-110 transition-transform" onClick={() => navigate('/')}>
              <ShoppingBag className="h-5 w-5 stroke-[1.5px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="container-shop py-20">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('order.success')}
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            {t('order.orderConfirmation')}
          </p>

          <div className="bg-card rounded-xl border border-border p-8 mb-8 shadow-sm">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-6 w-6 text-accent" />
              <span className="font-semibold text-lg">{t('order.orderNumber')}</span>
            </div>
            <p className="text-3xl font-black text-accent tracking-wider">{orderId}</p>
            <p className="text-sm text-muted-foreground mt-4 font-medium">
              ভবিষ্যতের জন্য এটি সংরক্ষণ করুন
            </p>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-8 mb-10 text-left border border-secondary">
            <h3 className="font-bold text-lg mb-6">পরবর্তী পদক্ষেপ কি?</h3>
            <ul className="space-y-4 text-gray-600 font-medium">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                আপনি SMS/ইমেলের মাধ্যমে একটি অর্ডার নিশ্চিতকরণ বার্তা পাবেন
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                আমাদের টিম ২৪ ঘণ্টার মধ্যে আপনার অর্ডারটি প্রসেস করবে
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                আপনার অর্ডারটি শিপ করা হলে আপনাকে জানানো হবে
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Link to="/">
              <Button className="btn-accent px-12 h-14 text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95">
                আরও অর্ডার করতে এখানে ক্লিক করুন
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* --- Minimalist Footer --- */}
      <footer className="py-6 bg-[#8b4513] text-white text-center">
        <p className="text-sm font-medium uppercase tracking-widest">
          Copyright | {settings?.site_name || 'AS Organic Hub'}
        </p>
      </footer>
    </div>
  );
}
