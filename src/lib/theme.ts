// src/lib/theme.ts

export interface ThemeColors {
  primary: string;
  'primary-content': string;
  secondary: string;
  'secondary-content': string;
  accent: string;
  'accent-content': string;
  neutral: string;
  'neutral-content': string;
  'base-100': string;
  'base-200': string;
  'base-300': string;
  'base-content': string;
  info: string;
  'info-content': string;
  success: string;
  'success-content': string;
  warning: string;
  'warning-content': string;
  error: string;
  'error-content': string;
}

export interface UserTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  createdAt: number;
}

export const DAISYUI_THEMES = ['light', 'dark', 'retro', 'emerald', 'valentine', 'forest'] as const;

export type DaisyUITheme = (typeof DAISYUI_THEMES)[number];

const THEME_KEY = 'duchi-theme';
const USER_THEMES_KEY = 'duchi-user-themes';

export const COLOR_KEYS: (keyof ThemeColors)[] = [
  'primary',
  'primary-content',
  'secondary',
  'secondary-content',
  'accent',
  'accent-content',
  'neutral',
  'neutral-content',
  'base-100',
  'base-200',
  'base-300',
  'base-content',
  'info',
  'info-content',
  'success',
  'success-content',
  'warning',
  'warning-content',
  'error',
  'error-content',
];

export const DEFAULT_COLORS: ThemeColors = {
  primary: 'oklch(0.65 0.2 250)',
  'primary-content': 'oklch(0.98 0.01 250)',
  secondary: 'oklch(0.65 0.2 320)',
  'secondary-content': 'oklch(0.98 0.01 320)',
  accent: 'oklch(0.65 0.15 180)',
  'accent-content': 'oklch(0.98 0.01 180)',
  neutral: 'oklch(0.35 0.02 250)',
  'neutral-content': 'oklch(0.95 0.01 250)',
  'base-100': 'oklch(1 0 0)',
  'base-200': 'oklch(0.96 0 0)',
  'base-300': 'oklch(0.92 0 0)',
  'base-content': 'oklch(0.2 0 0)',
  info: 'oklch(0.7 0.15 220)',
  'info-content': 'oklch(0.98 0.01 220)',
  success: 'oklch(0.7 0.2 145)',
  'success-content': 'oklch(0.98 0.01 145)',
  warning: 'oklch(0.8 0.18 85)',
  'warning-content': 'oklch(0.2 0.05 85)',
  error: 'oklch(0.65 0.2 25)',
  'error-content': 'oklch(0.98 0.01 25)',
};

export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_KEY) ?? 'light';
}

export function setStoredTheme(theme: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

export function getUserThemes(): UserTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USER_THEMES_KEY);
    if (stored) {
      return JSON.parse(stored) as UserTheme[];
    }
  } catch {
    return [];
  }
  return [];
}

export function setUserThemes(themes: UserTheme[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_THEMES_KEY, JSON.stringify(themes));
}

export function saveUserTheme(theme: UserTheme): void {
  const themes = getUserThemes();
  const existingIndex = themes.findIndex((t) => t.id === theme.id);
  if (existingIndex >= 0) {
    themes[existingIndex] = theme;
  } else {
    themes.push(theme);
  }
  setUserThemes(themes);
}

export function deleteUserTheme(themeId: string): void {
  const themes = getUserThemes().filter((t) => t.id !== themeId);
  setUserThemes(themes);
}

export function getUserTheme(themeId: string): UserTheme | undefined {
  return getUserThemes().find((t) => t.id === themeId);
}

export function isUserTheme(themeName: string): boolean {
  return themeName.startsWith('user-');
}

export function isDaisyUITheme(themeName: string): themeName is DaisyUITheme {
  return DAISYUI_THEMES.includes(themeName as DaisyUITheme);
}

export function applyTheme(themeName: string): void {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;

  COLOR_KEYS.forEach((key) => {
    html.style.removeProperty(`--color-${key}`);
  });

  if (isDaisyUITheme(themeName)) {
    html.setAttribute('data-theme', themeName);
  } else if (isUserTheme(themeName)) {
    const themeId = themeName.replace('user-', '');
    const userTheme = getUserTheme(themeId);

    html.setAttribute('data-theme', 'light');

    if (userTheme) {
      Object.entries(userTheme.colors).forEach(([key, value]: [string, string]) => {
        if (value) {
          html.style.setProperty(`--color-${key}`, value);
        }
      });
    }
  } else {
    html.setAttribute('data-theme', 'light');
  }
}

export function generateThemeId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createUserTheme(name: string, colors: ThemeColors): UserTheme {
  return {
    id: generateThemeId(),
    name,
    colors,
    createdAt: Date.now(),
  };
}

export function exportUserTheme(theme: UserTheme): string {
  return JSON.stringify(theme, null, 2);
}

export function importUserTheme(jsonString: string): UserTheme | null {
  try {
    const parsed = JSON.parse(jsonString) as UserTheme;
    if (parsed.name && parsed.colors) {
      return {
        ...parsed,
        id: generateThemeId(),
        createdAt: Date.now(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

export function parseOklch(value: string): OklchColor | null {
  const match = /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(value);
  if (!match) return null;

  let l = parseFloat(match[1]);
  if (l > 1) l = l / 100;

  return {
    l,
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  };
}

export function formatOklch(color: OklchColor): string {
  return `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
}

export function oklchToHex(color: OklchColor): string {
  const { l, c, h } = color;
  const hRad = (h * Math.PI) / 180;

  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const L = l;
  const m = L + 0.3963377774 * a + 0.2158037573 * b;
  const s = L - 0.1055613458 * a - 0.0638541728 * b;
  const l_ = L - 0.0894841775 * a - 1.291485548 * b;

  const m3 = m * m * m;
  const s3 = s * s * s;
  const l3 = l_ * l_ * l_;

  let r = 4.0767416621 * m3 - 3.3077115913 * s3 + 0.2309699292 * l3;
  let g = -1.2684380046 * m3 + 2.6097574011 * s3 - 0.3413193965 * l3;
  let b_ = -0.0041960863 * m3 - 0.7034186147 * s3 + 1.707614701 * l3;

  const toGamma = (x: number) =>
    x >= 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;

  r = Math.max(0, Math.min(1, toGamma(r)));
  g = Math.max(0, Math.min(1, toGamma(g)));
  b_ = Math.max(0, Math.min(1, toGamma(b_)));

  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b_)}`;
}

export function hexToOklch(hex: string): OklchColor {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (x: number) => (x >= 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92);

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  const l_ = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;

  const l_3 = Math.cbrt(l_);
  const m3 = Math.cbrt(m);
  const s3 = Math.cbrt(s);

  const L = 0.2104542553 * l_3 + 0.793617785 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l_3 - 2.428592205 * m3 + 0.4505937099 * s3;
  const b_ = 0.0259040371 * l_3 + 0.7827717662 * m3 - 0.808675766 * s3;

  const c = Math.sqrt(a * a + b_ * b_);
  let h = (Math.atan2(b_, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h };
}

export const GISCUS_THEME_MAP: Record<DaisyUITheme, string> = {
  light: 'light',
  dark: 'dark',
  retro: 'retro',
  emerald: 'emerald',
  valentine: 'valentine',
  forest: 'forest',
};

export function getGiscusTheme(themeName: string): string {
  if (typeof window === 'undefined') return 'light';

  // DaisyUI preset theme → custom CSS URL (absolute)
  if (isDaisyUITheme(themeName)) {
    return `${window.location.origin}/giscus/${GISCUS_THEME_MAP[themeName]}.css`;
  }

  // User custom theme → analyze base-100 lightness for light/dark fallback
  if (isUserTheme(themeName)) {
    const themeId = themeName.replace('user-', '');
    const userTheme = getUserTheme(themeId);
    if (userTheme) {
      const parsed = parseOklch(userTheme.colors['base-100']);
      if (parsed && parsed.l > 0.6) {
        return 'light';
      }
      return 'dark';
    }
  }

  // Unknown theme → default to light
  return 'light';
}
