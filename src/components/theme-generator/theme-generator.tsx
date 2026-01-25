// src/components/theme-generator/theme-generator.tsx
import { useRef, useState } from 'react';

import type { ThemeColors, UserTheme } from '@/lib/theme';
import { createUserTheme, DEFAULT_COLORS, exportUserTheme, saveUserTheme } from '@/lib/theme';

import ColorPickerPanel from './color-picker-panel';
import ThemePresets from './theme-presets';
import ThemePreview from './theme-preview';

export default function ThemeGenerator() {
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [themeName, setThemeName] = useState('My Theme');
  const [activeColor, setActiveColor] = useState<keyof ThemeColors | null>('primary');
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectPreset = (presetName: string) => {
    if (!probeRef.current) return;

    probeRef.current.setAttribute('data-theme', presetName);
    const style = getComputedStyle(probeRef.current);

    const newColors: Partial<ThemeColors> = {};
    const colorKeys: (keyof ThemeColors)[] = [
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

    colorKeys.forEach((key) => {
      const value = style.getPropertyValue(`--color-${key}`);
      if (value) {
        newColors[key] = value.trim();
      }
    });

    setColors({ ...DEFAULT_COLORS, ...newColors });
    setThemeName(presetName.charAt(0).toUpperCase() + presetName.slice(1));
    setEditingThemeId(null);
  };

  const handleEditUserTheme = (theme: UserTheme) => {
    setColors({ ...theme.colors });
    setThemeName(theme.name);
    setEditingThemeId(theme.id);
  };

  const historyBack = () => {
    const referrer = document.referrer;
    const isSameOrigin = referrer && new URL(referrer).origin === window.location.origin;
    if (isSameOrigin) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const handleSave = () => {
    if (editingThemeId) {
      const theme: UserTheme = {
        id: editingThemeId,
        name: themeName,
        colors,
        createdAt: Date.now(),
      };
      saveUserTheme(theme);
    } else {
      const theme = createUserTheme(themeName, colors);
      saveUserTheme(theme);
    }
    historyBack();
  };

  const handleExport = () => {
    const theme = editingThemeId
      ? { id: editingThemeId, name: themeName, colors, createdAt: Date.now() }
      : createUserTheme(themeName, colors);
    const json = exportUserTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewTheme = () => {
    setColors({ ...DEFAULT_COLORS });
    setThemeName('My Theme');
    setEditingThemeId(null);
  };

  return (
    <div className="bg-base-100 flex h-screen flex-col">
      <div ref={probeRef} className="hidden" />

      <header className="border-base-300 flex items-center gap-4 border-b px-4 py-3">
        <button type="button" onClick={historyBack} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <input
          type="text"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          className="input input-bordered input-sm w-48"
          placeholder="Theme name"
        />
        {editingThemeId && <span className="badge badge-info badge-sm">Editing</span>}
        <div className="flex-1" />
        {editingThemeId && (
          <button type="button" onClick={handleNewTheme} className="btn btn-ghost btn-sm">
            New Theme
          </button>
        )}
        <button type="button" onClick={handleExport} className="btn btn-outline btn-sm">
          Export JSON
        </button>
        <button type="button" onClick={handleSave} className="btn btn-primary btn-sm">
          {editingThemeId ? 'Update Theme' : 'Save Theme'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="border-base-300 flex-1 border-r p-4">
          <ThemePreview colors={colors} />
        </div>

        <div className="border-base-300 w-80 border-r">
          <ColorPickerPanel
            colors={colors}
            activeColor={activeColor}
            onColorChange={handleColorChange}
            onActiveColorChange={setActiveColor}
          />
        </div>

        <div className="w-72 p-4">
          <ThemePresets onSelectPreset={handleSelectPreset} onEditUserTheme={handleEditUserTheme} />
        </div>
      </div>
    </div>
  );
}
