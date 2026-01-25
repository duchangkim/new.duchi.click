// src/components/theme-generator/theme-presets.tsx
import { useCallback, useState } from 'react';

import type { UserTheme } from '@/lib/theme';
import { DAISYUI_THEMES, deleteUserTheme, getUserThemes } from '@/lib/theme';

interface Props {
  onSelectPreset: (themeName: string) => void;
  onEditUserTheme: (theme: UserTheme) => void;
}

interface PresetColors {
  base: string;
  baseContent: string;
  primary: string;
  secondary: string;
  accent: string;
}

export default function ThemePresets({ onSelectPreset, onEditUserTheme }: Props) {
  const [presetColors, setPresetColors] = useState<Record<string, PresetColors>>({});
  const [userThemes, setUserThemes] = useState<UserTheme[]>(() => {
    if (typeof window === 'undefined') return [];
    return getUserThemes();
  });

  const probeRefCallback = useCallback((probe: HTMLDivElement | null) => {
    if (!probe) return;

    const colors: Record<string, PresetColors> = {};

    DAISYUI_THEMES.forEach((theme) => {
      probe.setAttribute('data-theme', theme);
      const style = getComputedStyle(probe);
      colors[theme] = {
        base: style.getPropertyValue('--color-base-100') || '#ffffff',
        baseContent: style.getPropertyValue('--color-base-content') || '#000000',
        primary: style.getPropertyValue('--color-primary') || '#570df8',
        secondary: style.getPropertyValue('--color-secondary') || '#f000b8',
        accent: style.getPropertyValue('--color-accent') || '#37cdbe',
      };
    });

    setPresetColors(colors);
  }, []);

  const handleDeleteUserTheme = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteUserTheme(themeId);
    setUserThemes(getUserThemes());
  };

  const handleEditUserTheme = (theme: UserTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditUserTheme(theme);
  };

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-4 text-lg font-semibold">Presets</h3>

      <div ref={probeRefCallback} className="hidden" />

      <div className="flex-1 space-y-2 overflow-y-auto">
        {DAISYUI_THEMES.map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => onSelectPreset(theme)}
            className="btn btn-ghost btn-block justify-start gap-2 border-0"
          >
            {presetColors[theme] && (
              <div
                className="flex gap-1 rounded-md px-2 py-1.5"
                style={{ backgroundColor: presetColors[theme].base }}
              >
                <div
                  className="size-2 rounded-full border border-current/20"
                  style={{ backgroundColor: presetColors[theme].baseContent }}
                />
                <div
                  className="size-2 rounded-full border border-current/20"
                  style={{ backgroundColor: presetColors[theme].secondary }}
                />
                <div
                  className="size-2 rounded-full border border-current/20"
                  style={{ backgroundColor: presetColors[theme].accent }}
                />
              </div>
            )}
            <span className="text-primary capitalize">{theme}</span>
          </button>
        ))}

        {userThemes.length > 0 && (
          <>
            <div className="divider my-2 text-xs opacity-60">My Themes</div>
            {userThemes.map((theme) => (
              <div
                key={theme.id}
                className="btn btn-ghost btn-block justify-between gap-2 border-0"
              >
                <button
                  type="button"
                  onClick={() => onEditUserTheme(theme)}
                  className="flex flex-1 items-center gap-2"
                >
                  <div
                    className="flex gap-1 rounded-md px-2 py-1.5"
                    style={{ backgroundColor: theme.colors['base-100'] }}
                  >
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: theme.colors['base-content'] }}
                    />
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                  <span className="text-primary truncate">{theme.name}</span>
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleEditUserTheme(theme, e)}
                    className="btn btn-ghost btn-xs"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteUserTheme(theme.id, e)}
                    className="btn btn-ghost btn-xs text-error"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
