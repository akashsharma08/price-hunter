import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { Logo } from '@/shared/components/Logo';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';
import { logout } from '@/shared/api/products';
import { useAuthStore } from '@/store/auth-store';

const NAV_LINKS = [
  { to: '/search', label: 'Search' },
  { to: '/search?category=smartphones', label: 'Smartphones' },
  { to: '/search?category=laptops', label: 'Laptops' },
  { to: '/search?category=headphones', label: 'Headphones' },
  { to: '/dashboard', label: 'Dashboard' },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearSession = useAuthStore((s) => s.clearSession);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    setOpen(false);
  }

  async function handleLogout() {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // still clear local session
    }
    clearSession();
    setOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
        <Logo />

        <form
          onSubmit={submitSearch}
          className="relative mx-auto hidden min-w-0 flex-1 max-w-xl md:block"
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phones, laptops, headphones…"
            className="h-10 w-full rounded-md border border-border bg-surface-elevated pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            aria-label="Search products"
          />
        </form>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-elevated hover:text-ink',
                  isActive && 'bg-surface-elevated text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            aria-label="Open search"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          {user ? (
            <>
              <span className="hidden text-sm text-ink-muted md:inline">{user.name}</span>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => void handleLogout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" className="hidden sm:block">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-surface px-4 py-4 lg:hidden"
        >
          <form onSubmit={submitSearch} className="mb-4 md:hidden" role="search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="h-11 w-full rounded-md border border-border bg-surface-elevated pl-10 pr-3 text-sm"
                aria-label="Search products"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 flex gap-2 sm:hidden">
              {user ? (
                <Button className="w-full" variant="secondary" onClick={() => void handleLogout()}>
                  Log out
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
