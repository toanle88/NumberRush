export type Theme = 'dark' | 'light';

export interface AccessibilityPreferences {
  theme: Theme;
  highContrast: boolean;
  reducedMotion: boolean;
  sound: boolean;
  haptics: boolean;
}

export const ACCESSIBILITY_STORAGE_KEY = 'numberrush_accessibility';

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  theme: 'dark',
  highContrast: false,
  reducedMotion: false,
  sound: true,
  haptics: true,
};

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light';

export const readAccessibilityPreferences = (): AccessibilityPreferences => {
  try {
    const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!saved) return DEFAULT_ACCESSIBILITY_PREFERENCES;

    const parsed = JSON.parse(saved) as Partial<AccessibilityPreferences>;
    return {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      ...parsed,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_ACCESSIBILITY_PREFERENCES.theme,
      highContrast: parsed.highContrast === true,
      reducedMotion: parsed.reducedMotion === true,
      sound: parsed.sound !== false,
      haptics: parsed.haptics !== false,
    };
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }
};

export const saveAccessibilityPreferences = (preferences: AccessibilityPreferences) => {
  localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
};

export const getSystemReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const triggerHaptic = (enabled: boolean, pattern: number | number[]) => {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
};
