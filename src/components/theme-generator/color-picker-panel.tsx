// src/components/theme-generator/color-picker-panel.tsx
import { useMemo, useState } from 'react';

import type { OklchColor, ThemeColors } from '@/lib/theme';
import { formatOklch, parseOklch } from '@/lib/theme';

interface Props {
  colors: ThemeColors;
  activeColor: keyof ThemeColors | null;
  onColorChange: (key: keyof ThemeColors, value: string) => void;
  onActiveColorChange: (key: keyof ThemeColors | null) => void;
}

const COLOR_GROUPS = [
  { label: 'Primary', keys: ['primary', 'primary-content'] as const },
  { label: 'Secondary', keys: ['secondary', 'secondary-content'] as const },
  { label: 'Accent', keys: ['accent', 'accent-content'] as const },
  { label: 'Neutral', keys: ['neutral', 'neutral-content'] as const },
  {
    label: 'Base',
    keys: ['base-100', 'base-200', 'base-300', 'base-content'] as const,
  },
  { label: 'Info', keys: ['info', 'info-content'] as const },
  { label: 'Success', keys: ['success', 'success-content'] as const },
  { label: 'Warning', keys: ['warning', 'warning-content'] as const },
  { label: 'Error', keys: ['error', 'error-content'] as const },
];

const DEFAULT_OKLCH: OklchColor = { l: 0.5, c: 0.15, h: 250 };

export default function ColorPickerPanel({
  colors,
  activeColor,
  onColorChange,
  onActiveColorChange,
}: Props) {
  const [localOklch, setLocalOklch] = useState<OklchColor | null>(null);

  const oklch = useMemo(() => {
    if (localOklch) return localOklch;
    if (activeColor && colors[activeColor]) {
      const parsed = parseOklch(colors[activeColor]);
      if (parsed) return parsed;
    }
    return DEFAULT_OKLCH;
  }, [activeColor, colors, localOklch]);

  const handleColorSelect = (key: keyof ThemeColors) => {
    setLocalOklch(null);
    onActiveColorChange(key);
  };

  const handleSliderChange = (key: keyof OklchColor, value: number) => {
    const newOklch = { ...oklch, [key]: value };
    setLocalOklch(newOklch);
    if (activeColor) {
      onColorChange(activeColor, formatOklch(newOklch));
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <h3 className="text-lg font-semibold">Colors</h3>

      <div className="space-y-4">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-sm font-medium opacity-70">{group.label}</div>
            <div className="flex flex-wrap gap-2">
              {group.keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleColorSelect(key)}
                  className={`h-10 w-10 rounded-lg border-2 transition-all ${
                    activeColor === key
                      ? 'border-primary ring-primary/50 ring-2'
                      : 'border-base-300'
                  }`}
                  style={{ backgroundColor: colors[key] }}
                  title={key}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeColor && (
        <div className="rounded-box bg-base-200 mt-4 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div
              className="border-base-300 h-12 w-12 rounded-lg border"
              style={{ backgroundColor: colors[activeColor] }}
            />
            <div>
              <div className="font-medium">{activeColor}</div>
              <div className="font-mono text-xs opacity-70">{colors[activeColor]}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 flex justify-between text-sm">
                <span>Lightness</span>
                <span className="font-mono">{oklch.l.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={oklch.l}
                onChange={(e) => handleSliderChange('l', parseFloat(e.target.value))}
                className="range range-primary range-sm"
              />
            </div>

            <div>
              <label className="mb-1 flex justify-between text-sm">
                <span>Chroma</span>
                <span className="font-mono">{oklch.c.toFixed(3)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.005"
                value={oklch.c}
                onChange={(e) => handleSliderChange('c', parseFloat(e.target.value))}
                className="range range-primary range-sm"
              />
            </div>

            <div>
              <label className="mb-1 flex justify-between text-sm">
                <span>Hue</span>
                <span className="font-mono">{oklch.h.toFixed(0)}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={oklch.h}
                onChange={(e) => handleSliderChange('h', parseFloat(e.target.value))}
                className="range range-primary range-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
