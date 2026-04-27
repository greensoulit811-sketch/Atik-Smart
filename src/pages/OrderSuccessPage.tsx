import { useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { useOrderByNumber } from '@/hooks/useOrders';
import { trackPurchase } from '@/lib/facebook-pixel';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'N/A';
  const { t, settings } = useSiteSettings();
  const { data: order } = useOrderByNumber(orderId);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (order && !trackedRef.current) {
      trackPurchase({
        orderId: order.order_number,
        value: order.total,
        currency: settings.currency_code,
        contents: order.order_items.map(item => ({
          id: item.product_id || 'unknown',
          quantity: item.quantity,
          item_price: item.price
        })),
        email: order.customer_email || undefined,
        phone: order.customer_phone
      });
      trackedRef.current = true;
    }
  }, [order, settings.currency_code]);

  return (
    <Layout>
      <div className="container-shop section-padding">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('order.success')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('order.orderConfirmation')}
          </p>

          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-6 w-6 text-accent" />
              <span className="font-semibold">{t('order.orderNumber')}</span>
            </div>
            <p className="text-2xl font-bold text-accent">{orderId}</p>
            <p className="text-sm text-muted-foreground mt-2">
              ভবিষ্যতের জন্য এটি সংরক্ষণ করুন
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">পরবর্তী পদক্ষেপ কি?</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                আপনি SMS/ইমেলের মাধ্যমে একটি অর্ডার নিশ্চিতকরণ বার্তা পাবেন
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                আমাদের টিম ২৪ ঘণ্টার মধ্যে আপনার অর্ডারটি প্রসেস করবে
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                আপনার অর্ডারটি শিপ করা হলে আপনাকে জানানো হবে
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button className="btn-accent">
                {t('cart.continueShopping')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">{t('common.back')} {t('nav.home')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
