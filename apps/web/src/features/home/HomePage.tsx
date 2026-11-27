import { BestDealsSection } from './BestDealsSection';
import { CategoriesSection } from './CategoriesSection';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { TrendingSection } from './TrendingSection';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrendingSection />
      <CategoriesSection />
      <BestDealsSection />
      <HowItWorksSection />
    </>
  );
}
