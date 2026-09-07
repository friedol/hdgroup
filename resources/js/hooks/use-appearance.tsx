import { useSyncExternalStore } from 'react';
import { router } from '@inertiajs/react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const isDarkMode = (appearance: Appearance): boolean => {
    if (appearance === 'system') {
        return prefersDark();
    }
    return appearance === 'dark';
};

const isLandingPage = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.location.pathname === '/' || window.location.pathname === '';
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    if (isLandingPage()) {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        return;
    }

    const isDark = isDarkMode(appearance);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => applyTheme(currentAppearance);

let isInitialized = false;

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    currentAppearance = getStoredAppearance();
    applyTheme(currentAppearance);

    if (!isInitialized) {
        isInitialized = true;
        // Set up system theme change listener
        mediaQuery()?.addEventListener('change', handleSystemThemeChange);

        // Listen for Inertia page transitions to handle landing page vs other pages
        router.on('navigate', (event) => {
            const pageComponent = event.detail.page?.component;
            const pathname = window.location.pathname;
            const isLanding = pageComponent === 'Shop/Index' || pathname === '/' || pathname === '';

            if (isLanding) {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
            } else {
                const isDark = isDarkMode(currentAppearance);
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
            }
        });
    }
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );

    const resolvedAppearance: ResolvedAppearance = isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        currentAppearance = mode;

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', mode);

        // Store in cookie for SSR...
        setCookie('appearance', mode);

        applyTheme(mode);
        notify();
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}

