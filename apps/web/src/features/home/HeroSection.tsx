import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Headphones, Laptop, Search, Smartphone } from 'lucide-react';
import { DEMO_SEARCH_SUGGESTIONS } from '@/data/demo/catalog';
import { Button } from '@/shared/ui/Button';

const CATEGORY_SHORTCUTS = [
  { to: '/search?category=smartphones', label: 'Smartphones', icon: Smartphone },
  { to: '/search?category=laptops', label: 'Laptops', icon: Laptop },
  { to: '/search?category=headphones', label: 'Headphones', icon: Headphones },
] as const;

export function HeroSection() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const suggestions = useMemo(() => [...DEMO_SEARCH_SUGGESTIONS], []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <section className="relative overflow-hidden gradient-mesh">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" aria-hidden />
      <motion.div
        className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl animate-float-glow"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-lime/15 blur-3xl animate-float-glow"
        style={{ animationDelay: '2s' }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-20 pt-16 lg:px-6 lg:pb-28 lg:pt-24">
        <div className="max-w-3xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            PRICE HUNTER
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-ink text-balance sm:text-6xl lg:text-7xl">
            Discover the real price before you buy.
          </h1>
          <p className="max-w-xl text-lg text-ink-muted text-balance">
            Compare Indian retailers, track historical moves, and set target alerts — built for
            smartphones, laptops, and headphones.
          </p>
        </div>

        <form onSubmit={onSubmit} className="max-w-2xl space-y-4" role="search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a product…"
                className="h-14 w-full rounded-md border border-border bg-surface/90 pl-12 pr-4 text-base text-ink shadow-[0_0_0_1px_color-mix(in_oklab,#22d3ee_12%,transparent)] placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                aria-label="Discover products"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8">
              Search
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-faint">Suggestions</span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  navigate(`/search?q=${encodeURIComponent(item)}`);
                }}
                className="rounded-sm border border-border bg-surface-elevated px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
              >
                {item}
              </button>
            ))}
          </div>
        </form>

        <div className="flex flex-wrap gap-3">
          {CATEGORY_SHORTCUTS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
            >
              <Icon className="h-4 w-4 text-accent" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
