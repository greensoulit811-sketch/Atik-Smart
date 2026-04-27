import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, Loader2 } from 'lucide-react';
import { Product, Category } from '@/hooks/useShopData';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { trackAddToCart } from '@/lib/facebook-pixel';
import { WishlistButton } from '@/components/products/WishlistButton';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product & { category?: Category | null };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { t, formatCurrency, settings } = useSiteSettings();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      toast.info('অনুগ্রহ করে সাইজ/কালার অপশন নির্বাচন করুন');
      navigate(`/product/${product.slug}`);
      return;
    }

    setIsAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price ?? undefined,
      image: product.images[0] || '/placeholder.svg',
      quantity: 1,
      stock: product.stock,
    });

    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: (product.sale_price ?? product.price) * 1,
      currency: 'BDT', // Defaulting to BDT if settings not available here, but let's try to pass settings
      quantity: 1,
    });
    
    toast.success(t('product.addedToCart'), {
      description: product.name,
    });
    
    setIsAddingToCart(false);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      toast.info('অনুগ্রহ করে সাইজ/কালার অপশন নির্বাচন করুন');
      navigate(`/product/${product.slug}`);
      return;
    }

    setIsBuyingNow(true);
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price ?? undefined,
      image: product.images[0] || '/placeholder.svg',
      quantity: 1,
      stock: product.stock,
    });

    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: (product.sale_price ?? product.price) * 1,
      currency: settings.currency_code,
      quantity: 1,
    });
    
    navigate('/checkout?mode=buynow');
  };

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.sale_price! / product.price) * 100)
    : 0;

  return (
    <div className="group bg-card rounded-md border border-border/60 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:border-border">
      <Link to={`/product/${product.slug}`} className="block flex-1">
        {/* Image */}
        <div className="relative lg:aspect-[5/6] aspect-[4/5.5] overflow-hidden bg-secondary/50">
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_new && (
              <span className="bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md">
                {t('product.new')}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-destructive text-destructive-foreground px-2.5 py-1 text-[10px] font-bold rounded-md">
                -{discountPercent}%
              </span>
            )}
          </div>
          
          {/* Wishlist Button */}
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton productId={product.id} size="sm" className="bg-background/90 backdrop-blur-sm shadow-sm border-0" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 text-center">
          <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-widest font-medium">
            {product.category?.name || t('product.uncategorized')}
          </p>
          <h3 className="font-semibold text-sm lg:text-lg line-clamp-1 mb-2 group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 justify-center">
            {hasDiscount ? (
              <>
                <span className="font-bold text-primary text-base">
                  {formatCurrency(product.sale_price!)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </span>
              </>
            ) : (
              <span className="font-bold text-base">{formatCurrency(product.price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-3 pb-3 mt-auto flex flex-col gap-1.5 sm:px-4 sm:pb-4 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 sm:h-10 text-xs sm:text-sm font-medium rounded-lg border-border hover:border-primary hover:bg-primary/5 transition-all gap-1.5 sm:gap-2"
          onClick={handleAddToCart}
          disabled={isAddingToCart || product.stock === 0}
          aria-label={product.has_variants ? 'অপশন দেখুন' : t('product.addToCart')}
        >
          {isAddingToCart && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
          {product.has_variants ? 'অপশন দেখুন' : t('product.addToCart')}
        </Button>
        <Button
          size="sm"
          className="btn-accent w-full h-8 sm:h-10 text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all gap-1.5 sm:gap-2"
          onClick={handleBuyNow}
          disabled={isBuyingNow || product.stock === 0}
          aria-label={t('product.buyNow')}
        >
          {isBuyingNow && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
          {t('product.buyNow')}
        </Button>
      </div>
    </div>
  );
}
