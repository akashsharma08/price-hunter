import { Link } from 'react-router-dom';
import { Logo } from '@/shared/components/Logo';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-ink-muted">
            Intelligent shopping for India — compare prices, track history, and catch genuine deals
            across retailers.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Explore
          </h2>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>
              <Link to="/search" className="hover:text-ink">
                Product search
              </Link>
            </li>
            <li>
              <Link to="/search?category=smartphones" className="hover:text-ink">
                Smartphones
              </Link>
            </li>
            <li>
              <Link to="/search?category=laptops" className="hover:text-ink">
                Laptops
              </Link>
            </li>
            <li>
              <Link to="/search?category=headphones" className="hover:text-ink">
                Headphones
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Account
          </h2>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>
              <Link to="/dashboard" className="hover:text-ink">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-ink">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/signup" className="hover:text-ink">
                Sign up
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Trust
          </h2>
          <p className="text-sm text-ink-muted">
            Phase 1 ships with labelled demonstration data. Live retailer adapters and verified
            prices arrive in later phases — never invent live prices.
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>© {new Date().getFullYear()} PRICE HUNTER. Built for Indian consumers.</p>
          <p>Currency shown in INR · Demo catalog only</p>
        </div>
      </div>
    </footer>
  );
}
