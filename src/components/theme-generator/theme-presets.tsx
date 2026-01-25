// src/components/theme-generator/theme-presets.tsx
import { useCallback, useState } from 'react';

import { DAISYUI_THEMES } from '@/lib/theme';

interface Props {
  onSelectPreset: (themeName: string) => void;
}

interface PresetColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
}

export default function ThemePresets({ onSelectPreset }: Props) {
  const [presetColors, setPresetColors] = useState<Record<string, PresetColors>>({});

  const probeRefCallback = useCallback((probe: HTMLDivElement | null) => {
    if (!probe) return;

    const colors: Record<string, PresetColors> = {};

    DAISYUI_THEMES.forEach((theme) => {
      probe.setAttribute('data-theme', theme);
      const style = getComputedStyle(probe);
      colors[theme] = {
        primary: style.getPropertyValue('--color-primary') || '#570df8',
        secondary: style.getPropertyValue('--color-secondary') || '#f000b8',
        accent: style.getPropertyValue('--color-accent') || '#37cdbe',
        neutral: style.getPropertyValue('--color-neutral') || '#3d4451',
      };
    });

    setPresetColors(colors);
  }, []);

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
            className="btn btn-ghost btn-block justify-start gap-3"
          >
            <div className="flex gap-1">
              {presetColors[theme] && (
                <>
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: presetColors[theme].primary }}
                  />
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: presetColors[theme].secondary }}
                  />
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: presetColors[theme].accent }}
                  />
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: presetColors[theme].neutral }}
                  />
                </>
              )}
            </div>
            <span className="capitalize">{theme}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
