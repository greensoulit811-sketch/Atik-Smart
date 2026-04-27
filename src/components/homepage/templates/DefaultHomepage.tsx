import { Layout } from '@/components/layout/Layout';
import { HeroSlider } from '@/components/home/HeroSlider';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { BestSellers } from '@/components/home/BestSellers';


import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useNewArrivals } from '@/hooks/useShopData';
import { ProductCard } from '@/components/products/ProductCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ section: HomepageSection }>> = {
  hero_slider: () => <HeroSlider />,
  featured_categories: () => <FeaturedCategories />,
  featured_products: () => <FeaturedProducts />,
  best_sellers: () => <BestSellers />,

  
};



export function DefaultHomepage({ sections }: { sections: HomepageSection[] }) {
  return (
    <Layout>
      {sections.map((section) => {

        const Component = SECTION_COMPONENTS[section.section_type];
        if (Component) return <Component key={section.id} section={section} />;
        return null;
      })}
    </Layout>
  );
}
