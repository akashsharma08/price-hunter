import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProductLayout = 'grid' | 'list';

interface UiState {
  searchLayout: ProductLayout;
  setSearchLayout: (layout: ProductLayout) => void;
  recentSearches: string[];
  pushRecentSearch: (query: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      searchLayout: 'grid',
      setSearchLayout: (layout) => set({ searchLayout: layout }),
      recentSearches: [],
      pushRecentSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const next = [trimmed, ...get().recentSearches.filter((q) => q !== trimmed)].slice(0, 8);
        set({ recentSearches: next });
      },
    }),
    { name: 'price-hunter-ui' },
  ),
);
