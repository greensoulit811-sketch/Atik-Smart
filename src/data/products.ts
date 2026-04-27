export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  category: string;
  categorySlug: string;
  stock: number;
  sku: string;
  shortDescription: string;
  description: string;
  images: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface SliderSlide {
  id: string;
  image: string;
  heading: string;
  text: string;
  ctaText: string;
  ctaLink: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

// Sample Categories
export const categories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    productCount: 24,
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    productCount: 36,
  },
  {
    id: '3',
    name: 'Home & Living',
    slug: 'home-living',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    productCount: 18,
  },
  {
    id: '4',
    name: 'Sports',
    slug: 'sports',
    image: 'https://images.unsplash.com/photo-1461896836934- voices?w=600&q=80',
    productCount: 12,
  },
];

// Sample Products
export const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Noise-Canceling Headphones',
    slug: 'wireless-headphones',
    price: 299,
    salePrice: 249,
    category: 'Electronics',
    categorySlug: 'electronics',
    stock: 15,
    sku: 'WH-1000XM4',
    shortDescription: 'Premium wireless headphones with industry-leading noise cancellation.',
    description: 'Experience the next level of silence with these premium wireless headphones. Featuring advanced noise-canceling technology, exceptional sound quality, and up to 30 hours of battery life. Perfect for travel, work, or relaxation.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    ],
    isNew: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Minimalist Leather Watch',
    slug: 'leather-watch',
    price: 189,
    category: 'Fashion',
    categorySlug: 'fashion',
    stock: 25,
    sku: 'MW-2024',
    shortDescription: 'Elegant timepiece with genuine leather strap.',
    description: 'A beautiful minimalist watch crafted with premium materials. Features a sleek dial design, genuine Italian leather strap, and Japanese quartz movement. Water-resistant up to 30 meters.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',
    ],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Modern Ceramic Vase Set',
    slug: 'ceramic-vase-set',
    price: 79,
    salePrice: 59,
    category: 'Home & Living',
    categorySlug: 'home-living',
    stock: 30,
    sku: 'CV-SET3',
    shortDescription: 'Set of 3 handcrafted ceramic vases.',
    description: 'Transform your space with this elegant set of three ceramic vases. Each piece is handcrafted with attention to detail, featuring a matte finish and organic shapes. Perfect for fresh or dried flowers.',
    images: [
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80',
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80',
    ],
    isNew: true,
  },
  {
    id: '4',
    name: 'Premium Yoga Mat',
    slug: 'yoga-mat',
    price: 69,
    category: 'Sports',
    categorySlug: 'sports',
    stock: 50,
    sku: 'YM-PRO',
    shortDescription: 'Eco-friendly non-slip yoga mat with alignment lines.',
    description: 'Elevate your practice with this premium eco-friendly yoga mat. Features alignment lines, superior grip, and optimal cushioning for joints. Made from natural rubber and TPE.',
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    ],
    isFeatured: true,
  },
  {
    id: '5',
    name: 'Smart Home Speaker',
    slug: 'smart-speaker',
    price: 149,
    salePrice: 119,
    category: 'Electronics',
    categorySlug: 'electronics',
    stock: 20,
    sku: 'SHS-360',
    shortDescription: 'Voice-controlled smart speaker with 360° sound.',
    description: 'Fill your room with rich, immersive sound. This smart speaker features voice control, multi-room audio support, and seamless integration with your smart home devices.',
    images: [
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
      'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=80',
    ],
    isBestSeller: true,
  },
  {
    id: '6',
    name: 'Cotton Linen Blend Shirt',
    slug: 'linen-shirt',
    price: 89,
    category: 'Fashion',
    categorySlug: 'fashion',
    stock: 40,
    sku: 'LS-001',
    shortDescription: 'Breathable summer shirt in neutral tones.',
    description: 'Stay cool and stylish with this premium cotton-linen blend shirt. Features a relaxed fit, mother-of-pearl buttons, and a subtle texture. Perfect for warm weather.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80',
    ],
    isNew: true,
  },
  {
    id: '7',
    name: 'Scented Candle Collection',
    slug: 'scented-candles',
    price: 45,
    category: 'Home & Living',
    categorySlug: 'home-living',
    stock: 60,
    sku: 'SC-TRIO',
    shortDescription: 'Trio of hand-poured soy wax candles.',
    description: 'Create the perfect ambiance with our collection of three hand-poured soy candles. Features notes of sandalwood, vanilla, and fresh linen. 40+ hours burn time each.',
    images: [
      'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800&q=80',
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80',
    ],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: '8',
    name: 'Running Shoes Pro',
    slug: 'running-shoes',
    price: 159,
    salePrice: 129,
    category: 'Sports',
    categorySlug: 'sports',
    stock: 35,
    sku: 'RS-PRO',
    shortDescription: 'Lightweight performance running shoes.',
    description: 'Engineered for speed and comfort. These running shoes feature responsive cushioning, breathable mesh upper, and durable rubber outsole. Perfect for both training and race day.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    ],
    isNew: true,
    isFeatured: true,
  },
];

// Sample Slider Slides
export const sliderSlides: SliderSlide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    heading: 'New Season Arrivals',
    text: 'Discover our latest collection of premium products',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',
    heading: 'Summer Sale',
    text: 'Up to 50% off on selected items',
    ctaText: 'View Collection',
    ctaLink: '/shop?sale=true',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    heading: 'Premium Quality',
    text: 'Handpicked products for modern living',
    ctaText: 'Explore',
    ctaLink: '/shop',
  },
];

// Sample Reviews
export const reviews: Review[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    rating: 5,
    text: 'Absolutely love the quality of products here! Fast shipping and excellent customer service.',
    date: '2024-01-15',
  },
  {
    id: '2',
    name: 'Michael Chen',
    rating: 5,
    text: 'The headphones I bought exceeded my expectations. Will definitely shop here again!',
    date: '2024-01-10',
  },
  {
    id: '3',
    name: 'Emily Davis',
    rating: 4,
    text: 'Great selection and competitive prices. The checkout process was smooth and easy.',
    date: '2024-01-05',
  },
];

// Helper functions
export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(p => p.slug === slug);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter(p => p.categorySlug === categorySlug);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter(p => p.isFeatured);
};

export const getBestSellers = (): Product[] => {
  return products.filter(p => p.isBestSeller);
};

export const getNewArrivals = (): Product[] => {
  return products.filter(p => p.isNew);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find(c => c.slug === slug);
};

export const getRelatedProducts = (product: Product, limit = 4): Product[] => {
  return products
    .filter(p => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, limit);
};
