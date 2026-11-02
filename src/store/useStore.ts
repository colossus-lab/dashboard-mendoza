import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface StoreState {
  theme: Theme;
  toggleTheme: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const THEME_KEY = 'mendoza-theme';

export const useStore = create<StoreState>((set) => ({
  // public/theme-init.js ya resolvió el tema antes de pintar.
  theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),

  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
