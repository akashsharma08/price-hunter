import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <EmptyState
        title="Page not found"
        description="That route does not exist in PRICE HUNTER."
        action={
          <Link to="/">
            <Button>Back home</Button>
          </Link>
        }
      />
    </div>
  );
}
