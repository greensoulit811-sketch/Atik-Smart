import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLandingPage } from '@/hooks/useLandingPages';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks/useOrders';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useReviews, Product } from '@/hooks/useShopData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, ShieldCheck, Truck, ArrowRight, Zap, Phone, CheckCircle2, ChevronRight, Minus, Plus, Search, User, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { toast } from 'sonner';

// --- Luxury Minimalist Theme ---

const AutoImageSlider = ({ images }: { images: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  if (!images.length) return null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
          alt={`slide-${i}`}
        />
      ))}
    </div>
  );
};

const useLandingProducts = (ids: string[]) => {
  return useQuery({
    queryKey: ['landing_products', ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const { data, error } = await supabase.from('products').select('*').in('id', ids);
      if (error) throw error;
      const map = new Map((data || []).map(p => [p.id, p]));
      return ids.map(id => map.get(id)).filter(Boolean) as Product[];
    },
    enabled: ids.length > 0,
  });
};

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = useLandingPage(slug || '');
  const { formatCurrency, settings } = useSiteSettings();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const { data: shippingMethods = [] } = useShippingMethods(true);
  const { data: paymentMethods = [] } = usePaymentMethods(true);
  const { data: products = [] } = useLandingProducts(page?.product_ids || []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const accentColor = page?.accent_color || '#000000';

  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', address: '', city: '', 
    country: settings?.default_country_name || '', notes: '',
    shippingMethodId: '', paymentMethodId: '',
  });
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (products.length > 0 && !selectedProduct) setSelectedProduct(products[0]);
  }, [products]);

  useEffect(() => {
    if (shippingMethods.length > 0 && !formData.shippingMethodId) {
      setFormData(prev => ({ ...prev, shippingMethodId: shippingMethods[0].id }));
    }
  }, [shippingMethods]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !formData.paymentMethodId) {
      setFormData(prev => ({ ...prev, paymentMethodId: paymentMethods[0].id }));
    }
  }, [paymentMethods]);

  const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethodId);
  const shippingCost = selectedShipping?.base_rate || 0;
  const effectivePrice = selectedProduct ? (selectedProduct.sale_price ?? selectedProduct.price) : 0;
  const subtotal = effectivePrice * quantity;
  const total = subtotal + shippingCost;

  const selectedPayment = paymentMethods.find(m => m.id === formData.paymentMethodId);
  const hasPartial = selectedPayment?.allow_partial_delivery_payment || false;
  let advanceAmount = 0;
  let dueOnDelivery = total;
  if (hasPartial && selectedPayment) {
    if (selectedPayment.partial_type === 'delivery_charge') advanceAmount = shippingCost;
    else if (selectedPayment.partial_type === 'fixed_amount') advanceAmount = Math.min(selectedPayment.fixed_partial_amount || 0, total);
    dueOnDelivery = total - advanceAmount;
  }
  const requiresTrxId = selectedPayment?.require_transaction_id || false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const scrollToCheckout = () => {
    document.getElementById('lp-checkout')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast.error('সবগুলো ঘর পূরণ করুন');
      return;
    }
    if (requiresTrxId && !transactionId.trim()) {
      toast.error('ট্রানজ্যাকশন আইডি প্রয়োজন');
      return;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    try {
      await createOrder.mutateAsync({
        order: {
          order_number: orderNumber, user_id: user?.id || null,
          customer_name: formData.fullName, customer_phone: formData.phone,
          customer_email: formData.email || null, shipping_address: formData.address,
          shipping_city: formData.city, shipping_method: selectedShipping?.name || 'Standard',
          shipping_cost: shippingCost, payment_method: selectedPayment?.code || 'cod',
          subtotal, total, status: 'pending', notes: formData.notes || null,
          payment_method_id: selectedPayment?.id || null,
          payment_method_name: selectedPayment?.name || 'ক্যাশ অন ডেলিভারি',
          payment_status: hasPartial ? 'partial_paid' : 'unpaid',
          paid_amount: advanceAmount, due_amount: dueOnDelivery,
          transaction_id: transactionId.trim() || null,
        },
        items: [{
          product_id: selectedProduct.id, product_name: selectedProduct.name,
          product_image: selectedProduct.images?.[0] || '', quantity,
          price: effectivePrice, variant_id: null, variant_info: null,
        }],
      });
      navigate(`/order-success?orderId=${orderNumber}`);
    } catch (error) {}
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  if (!page) return <div className="min-h-screen flex items-center justify-center font-serif">Page Not Found</div>;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] selection:bg-black selection:text-white" style={{ '--accent': accentColor } as React.CSSProperties}>
      
      {/* --- External Fonts --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;600;800&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .letter-spacing-huge { letter-spacing: 0.2em; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- Header --- */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex-1 flex gap-6 text-[11px] font-bold uppercase tracking-widest hidden lg:flex">
              <a href="#" className="hover:opacity-50 transition-opacity">Collections</a>
              <a href="#" className="hover:opacity-50 transition-opacity">Shop</a>
              <a href="#" className="hover:opacity-50 transition-opacity">About</a>
           </div>
           
           <div className="flex-1 flex justify-center">
              <span className="text-2xl font-black font-serif uppercase tracking-tight leading-none text-center">
                {settings?.site_name?.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 !== 0 ? 'italic font-normal' : ''}>{word} </span>
                ))}
              </span>
           </div>

           <div className="flex-1 flex justify-end items-center gap-6">
              <button className="hover:scale-110 transition-transform"><Search className="h-5 w-5 stroke-[1.5px]" /></button>
              <button className="hover:scale-110 transition-transform" onClick={scrollToCheckout}><ShoppingBag className="h-5 w-5 stroke-[1.5px]" /></button>
              <a href={`tel:${settings?.phone}`} className="lg:flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hidden">
                <Phone className="h-3 w-3" /> Call Support
              </a>
           </div>
        </div>
      </header>

      {/* --- Hero Section (Split Look) --- */}
      <section className="relative bg-[#f9f9f9]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
           {/* Left Info */}
           <div className="flex flex-col justify-center px-10 py-20 lg:p-24 space-y-10 order-2 lg:order-1 bg-white">
              <div className="space-y-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.4em] text-gray-400">Shop New Collections</p>
                <h1 className="text-5xl lg:text-8xl font-serif font-black uppercase leading-[0.9] tracking-tighter">
                  Just In:<br />
                  <span className="italic font-normal">New Shape</span><br />
                  & Shades
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="w-16 h-[1px] bg-black"></div>
                 <p className="text-sm font-medium text-gray-500 max-w-sm">
                   {page.hero_subtitle || 'Discover our latest collection of premium eyewear designed for those who value both style and substance.'}
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                 <Button onClick={scrollToCheckout} className="h-16 px-10 bg-black text-white rounded-none text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-800 transition-colors">
                    {page.hero_cta_text}
                 </Button>
                 <Button variant="outline" onClick={scrollToCheckout} className="h-16 px-10 border-black rounded-none text-xs font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all">
                    View Catalog
                 </Button>
              </div>
              
              {/* Product Sketch Look (as seen in image) */}
              <div className="pt-12 hidden lg:block opacity-20">
                 <img src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=200" className="w-24 h-auto grayscale" alt="sketch" />
              </div>
           </div>

           {/* Right Image */}
           <div className="relative order-1 lg:order-2 overflow-hidden h-[50vh] lg:h-auto">
              <img src={page.hero_image || 'https://images.unsplash.com/photo-1511499767350-a1590fdb7307?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" alt="hero" />
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="absolute bottom-10 left-10 text-white space-y-2">
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Featured Look</p>
                 <h2 className="text-2xl font-serif italic">The Vintage Green</h2>
              </div>
           </div>
        </div>
      </section>

      {/* --- Best Sellers Grid --- */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto space-y-16">
        <div className="text-center space-y-4">
           <h2 className="text-3xl lg:text-5xl font-serif font-black uppercase tracking-tighter italic">Best Sellers</h2>
           <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">The most loved pieces</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
           {products.map((p) => (
             <div key={p.id} className="group cursor-pointer space-y-6" onClick={() => { setSelectedProduct(p); scrollToCheckout(); }}>
                <div className="aspect-[3/4] bg-[#fbfbfb] overflow-hidden relative border border-gray-50">
                   <img src={p.images?.[0]} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                   {p.sale_price && (
                      <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-white px-2 py-1">Limited</div>
                   )}
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                      <Button className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2 h-auto rounded-none">Quick View</Button>
                   </div>
                </div>
                <div className="space-y-1 text-center">
                   <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 leading-none">{p.name}</h3>
                   <p className="text-sm font-serif font-bold italic">{formatCurrency(p.sale_price ?? p.price)}</p>
                </div>
             </div>
           ))}
        </div>
        
        <div className="text-center pt-8">
           <button className="text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-black pb-2 hover:opacity-50 transition-opacity">View All Best Sellers</button>
        </div>
      </section>

      {/* --- Dynamic Celebrities Section --- */}
      <section className="py-32 bg-[#111] text-white">
        <div className="max-w-[1400px] mx-auto px-6">
           <div className="text-center space-y-4 mb-24">
              <h2 className="text-5xl lg:text-7xl font-serif font-black uppercase italic tracking-tighter">Celebrities</h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.6em] text-white/40 italic">Get the Look</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-0">
              {(page.features && page.features.length > 0 ? page.features : [
                { title: 'Cristiano', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800' },
                { title: 'Benedict', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800' },
                { title: 'William', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800' }
              ]).slice(0, 3).map((feat: any, i: number) => (
                <div key={i} className="group relative aspect-[4/5] overflow-hidden bg-zinc-900 cursor-none">
                   <img src={feat.image} className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110 grayscale hover:grayscale-0 opacity-60 group-hover:opacity-100" alt={feat.title} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                   <div className="absolute bottom-10 left-10 space-y-3">
                      <div className="w-8 h-[1px] bg-white/40 group-hover:w-16 transition-all duration-700"></div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/70 group-hover:text-white transition-colors">{feat.title}</h4>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- Limited Edition / Lifestyle --- */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto space-y-16">
        <div className="text-center space-y-4">
           <h2 className="text-3xl lg:text-5xl font-serif font-black uppercase tracking-tighter italic">Limited Edition</h2>
           <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">for a short time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {(page.how_to_use_cards.length > 0 ? page.how_to_use_cards.slice(0, 3) : [
             { image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&q=80', title: 'Exclusive Series 01' },
             { image: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?auto=format&fit=crop&q=80', title: 'Exclusive Series 02' },
             { image: 'https://images.unsplash.com/photo-1577733966973-d680bfee2e99?auto=format&fit=crop&q=80', title: 'Exclusive Series 03' }
           ]).map((c, i) => (
             <div key={i} className="space-y-6 group">
                <div className="aspect-[3/4] overflow-hidden relative">
                   <img src={c.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="limited" />
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{c.title}</p>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* --- Reimagined Luxury Product Showcase (Precision Section) --- */}
      <section className="py-32 px-6 bg-white overflow-hidden relative border-t border-gray-100">
        {/* Background Decorative Number */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 text-[30rem] lg:text-[40rem] font-serif font-black text-black/[0.02] leading-none select-none pointer-events-none">
          01
        </div>

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
          <div className="space-y-16">
            <div className="space-y-8">
              <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-400 block">
                Handcrafted Excellence
              </span>
              <h2 className="text-6xl lg:text-8xl font-serif font-black uppercase italic tracking-tighter leading-[0.9] text-black">
                Precision In<br />Every Detail
              </h2>
              <div className="w-20 h-[1px] bg-black/10"></div>
              <p className="max-w-md text-sm text-gray-500 leading-relaxed font-medium">
                Each piece is meticulously crafted by artisans using the finest materials and centuries-old techniques. Built to last a lifetime and beyond.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif font-bold italic">100%</span>
                </div>
                <div className="w-8 h-[1px] bg-black/20"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Purity & Quality<br />Guaranteed</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif font-bold italic">Hand</span>
                </div>
                <div className="w-8 h-[1px] bg-black/20"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Crafted with<br />Authenticity</p>
              </div>
            </div>

            <div className="pt-8">
               <Button onClick={scrollToCheckout} className="group h-20 px-16 bg-black text-white rounded-none text-xs font-bold uppercase tracking-[0.5em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10">Shop The Collection</span>
               </Button>
            </div>
          </div>

          <div className="relative group">
            {/* Decorative Frame Elements */}
            <div className="absolute -inset-10 border border-black/[0.03] -z-10 group-hover:inset-0 transition-all duration-1000"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 border-t-2 border-r-2 border-black/5"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 border-b-2 border-l-2 border-black/5"></div>
            
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] transition-transform duration-1000 group-hover:scale-[1.02]">
               <AutoImageSlider images={selectedProduct?.images || [page.hero_image || '']} />
               <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
               
               {/* Overlay Info */}
               <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                  <div className="space-y-2">
                    <div className="w-12 h-[2px] bg-black"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white mix-blend-difference">Premium Edition</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <div className="w-2 h-2 rounded-full bg-black/20"></div>
                    <div className="w-2 h-2 rounded-full bg-black/20"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Reimagined Luxury Checkout Section with Premium BG --- */}
      <section id="lp-checkout" className="py-32 px-6 bg-[#f8f5f2] border-t border-gray-100 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/[0.015] rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/[0.015] rounded-full blur-[120px]"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-black/[0.03]"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-black/[0.03]"></div>
        </div>

        <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
           
           {/* Order Summary (Sticky Sidebar) */}
           <div className="lg:col-span-5 lg:sticky lg:top-2">
              {selectedProduct && (
                <div className="bg-white p-10 lg:p-12 border border-gray-100 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.1)] space-y-10 relative overflow-hidden group">
                   <div className="absolute -top-12 -right-12 w-24 h-24 bg-black/[0.02] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                   
                   <div className="relative flex gap-10 items-center">
                      <div className="w-36 aspect-square bg-gray-50 border border-gray-100 p-4 transition-transform group-hover:-rotate-3 duration-500">
                         <img src={selectedProduct.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt={selectedProduct.name} />
                      </div>
                      <div className="flex-1 space-y-4">
                         <h5 className="font-serif text-3xl font-bold uppercase italic tracking-tight leading-tight">{selectedProduct.name}</h5>
                         <div className="flex items-center gap-8">
                            <span className="font-sans font-black text-3xl">{formatCurrency(effectivePrice)}</span>
                            <div className="flex items-center gap-8 bg-gray-50 border border-gray-100 px-5 py-2">
                               <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:opacity-30 transition-opacity"><Minus className="h-4 w-4" /></button>
                               <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                               <button type="button" onClick={() => setQuantity(quantity + 1)} className="hover:opacity-30 transition-opacity"><Plus className="h-4 w-4" /></button>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="relative space-y-6 pt-12 border-t border-gray-100">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400"><span>সাবটোটাল</span><span className="text-black">{formatCurrency(subtotal)}</span></div>
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400"><span>শিপিং চার্জ</span><span className="text-black">{formatCurrency(shippingCost)}</span></div>
                      <div className="flex justify-between items-center pt-10 border-t-2 border-red-500">
                         <span className="text-2xl lg:text-3xl font-serif font-black uppercase italic tracking-tighter">সর্বমোট</span>
                         <span className="text-5xl font-sans font-black text-red-600">{formatCurrency(total)}</span>
                      </div>
                   </div>

                   <div className="relative grid grid-cols-2 gap-6 pt-10 border-t border-gray-100 border-dashed">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black/60"><Truck className="h-4 w-4" /></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Insured Delivery</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black/60"><ShieldCheck className="h-4 w-4" /></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Safe Transaction</span>
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Checkout Form (Luxury Side-by-Side) */}
           <div className="lg:col-span-7 bg-white p-8 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-12">
                 
                 {/* Step 1: Contact Info */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                       <div className="w-2 h-6 bg-black"></div>
                       <h3 className="text-xl font-bold font-serif italic tracking-tight">যোগাযোগের তথ্য</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500">পূর্ণ নাম *</label>
                          <Input name="fullName" value={formData.fullName} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার নাম লিখুন" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500">ফোন নম্বর *</label>
                             <Input name="phone" value={formData.phone} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার ফোন নম্বর" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500">ইমেইল (ঐচ্ছিক)</label>
                             <Input name="email" type="email" className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার ইমেইল" />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Step 2: Shipping Info */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                       <div className="w-2 h-6 bg-black"></div>
                       <h3 className="text-xl font-bold font-serif italic tracking-tight">শিপিং ঠিকানা</h3>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500">শহর *</label>
                          <Input name="city" value={formData.city} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার শহর" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500">পূর্ণ ঠিকানা *</label>
                          <Input name="address" value={formData.address} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার পূর্ণ ঠিকানা (বাসা নং, রোড নং, এলাকা)" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500">অর্ডার নোট (ঐচ্ছিক)</label>
                          <textarea className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-black transition-all resize-none outline-none text-sm" placeholder="অর্ডার সংক্রান্ত কোনো তথ্য থাকলে এখানে লিখুন"></textarea>
                       </div>
                    </div>
                 </div>

                 {/* Step 3: Logistics & Payment */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                          <h3 className="text-sm font-bold tracking-tight">শিপিং পদ্ধতি</h3>
                       </div>
                       <div className="space-y-3">
                          {shippingMethods.map(m => (
                            <label key={m.id} className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${formData.shippingMethodId === m.id ? 'border-red-500 bg-red-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                               <div className="flex items-center gap-3">
                                  <input type="radio" name="shippingMethodId" value={m.id} checked={formData.shippingMethodId === m.id} onChange={handleChange} className="accent-red-500" />
                                  <span className="text-xs font-bold text-gray-700">{m.name}</span>
                               </div>
                               <span className="text-xs font-black text-red-600">{formatCurrency(m.base_rate)}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                          <h3 className="text-sm font-bold tracking-tight">পেমেন্ট পদ্ধতি</h3>
                       </div>
                       <div className="space-y-3">
                          {paymentMethods.map(pm => (
                            <div key={pm.id} className="space-y-3">
                               <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.paymentMethodId === pm.id ? 'border-red-500 bg-red-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                                  <input type="radio" name="paymentMethodId" value={pm.id} checked={formData.paymentMethodId === pm.id} onChange={handleChange} className="accent-red-500" />
                                  <span className="text-xs font-bold text-gray-700">{pm.name}</span>
                               </label>
                               {formData.paymentMethodId === pm.id && requiresTrxId && (
                                 <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="ট্রানজেকশন আইডি দিন" className="h-12 border-2 border-red-500 text-xs font-bold" />
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Confirmation Button */}
                 <div className="pt-6">
                    <Button type="submit" className="w-full h-16 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-lg transition-all shadow-xl shadow-red-200 group active:scale-95" disabled={createOrder.isPending || !selectedProduct}>
                       <span className="flex items-center justify-center gap-3">
                          {createOrder.isPending ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার সম্পন্ন করুন'}
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                       </span>
                    </Button>
                 </div>
              </form>
           </div>

        </div>
      </section>





      {/* --- Minimalist Footer (Exact Match to Image) --- */}
      <footer className="py-20 px-6 bg-white border-t border-gray-100">
         <div className="max-w-[1400px] mx-auto space-y-12">
            {/* Top: Brand & Menu */}
            <div className="flex flex-col items-center space-y-8">
               <span className="text-3xl font-serif font-black uppercase tracking-tighter italic">
                 {settings?.site_name}
               </span>
               <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                  <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Collection</a>
                  <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Celebrities</a>
                  <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Best Seller</a>
                  <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Shop</a>
               </nav>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  © {new Date().getFullYear()} {settings?.site_name} - ALL RIGHTS RESERVED.
               </p>
               <div className="flex items-center gap-6">
                  <a href="#" className="hover:scale-110 transition-transform"><Facebook className="h-4 w-4 stroke-[1.5px]" /></a>
                  <a href="#" className="hover:scale-110 transition-transform"><Instagram className="h-4 w-4 stroke-[1.5px]" /></a>
                  <a href="#" className="hover:scale-110 transition-transform"><Twitter className="h-4 w-4 stroke-[1.5px]" /></a>
                  <a href="#" className="hover:scale-110 transition-transform"><Youtube className="h-4 w-4 stroke-[1.5px]" /></a>
               </div>
            </div>
         </div>
      </footer>

    </div>
  );
}
