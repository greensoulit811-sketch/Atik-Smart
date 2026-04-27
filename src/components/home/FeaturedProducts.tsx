import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useShopData';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { ProductCard } from '@/components/products/ProductCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function FeaturedProducts() {
  const { data: products = [], isLoading } = useFeaturedProducts();
  const { t } = useSiteSettings();
  const { ref, isVisible } = useScrollReveal();

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/50">
        <div className="container-shop">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg md:text-3xl font-bold">{t('home.featuredProducts')}</h2>
              {/* <p className="text-muted-foreground mt-1">Handpicked just for you</p> */}
            </div>
          </div>
          <div className="product-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-product rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-secondary/50" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-5 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t('home.featuredProducts')}</h2>
            {/* <p className="text-muted-foreground mt-1">Handpicked just for you</p> */}
          </div>
          <Link
            to="/shop"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="product-grid gap-2 lg:gap-4">
          {products.map((product, index) => (
            <div key={product.id} className={`reveal-base stagger-${index + 1} ${isVisible ? 'reveal-visible' : ''}`}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <Link
          to="/shop"
          className="mt-8 flex sm:hidden items-center justify-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
