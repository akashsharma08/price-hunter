import { ArrowLeftRight, Bell, Search, Wallet } from 'lucide-react';

const STEPS = [
  {
    title: 'Search',
    description: 'Find the exact variant across phones, laptops, and headphones.',
    icon: Search,
  },
  {
    title: 'Compare',
    description: 'See retailer offers with currency, source, and availability status.',
    icon: ArrowLeftRight,
  },
  {
    title: 'Track',
    description: 'Watch immutable price snapshots and catch meaningful drops.',
    icon: Bell,
  },
  {
    title: 'Save',
    description: 'Set target alerts and buy when the market meets your number.',
    icon: Wallet,
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Four steps to a smarter purchase
          </h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-lg border border-border bg-canvas p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-elevated text-accent">
                  <step.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-mono text-xs text-ink-faint">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
