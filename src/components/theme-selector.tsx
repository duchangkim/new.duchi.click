// src/components/theme-selector.tsx
import { useEffect, useState } from "react";

import type { UserTheme } from "@/lib/theme";
import {
  applyTheme,
  DAISYUI_THEMES,
  getStoredTheme,
  getUserThemes,
  isUserTheme,
  setStoredTheme,
} from "@/lib/theme";

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "light";
    return getStoredTheme();
  });
  const [userThemes] = useState<UserTheme[]>(() => {
    if (typeof window === "undefined") return [];
    return getUserThemes();
  });

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    setStoredTheme(theme);
    applyTheme(theme);
  };

  const displayThemes = DAISYUI_THEMES.slice(0, 10);

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <svg
          className="h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-10 mt-3 max-h-96 w-52 overflow-y-auto  bg-base-200 p-2 shadow-2xl rounded-box"
      >
        {displayThemes.map((theme) => (
          <li key={theme}>
            <button
              type="button"
              className={`btn btn-ghost btn-sm btn-block justify-start capitalize ${
                currentTheme === theme ? "btn-active" : ""
              }`}
              onClick={() => handleThemeChange(theme)}
            >
              {theme}
            </button>
          </li>
        ))}

        {userThemes.length > 0 && (
          <>
            <li className="divider my-1" />
            <li className="menu-title text-xs opacity-60">My Themes</li>
            {userThemes.map((theme) => (
              <li key={theme.id}>
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm btn-block justify-start ${
                    currentTheme === `user-${theme.id}` ||
                    isUserTheme(currentTheme)
                      ? "btn-active"
                      : ""
                  }`}
                  onClick={() => handleThemeChange(`user-${theme.id}`)}
                >
                  {theme.name}
                </button>
              </li>
            ))}
          </>
        )}

        <li className="divider my-1" />
        <li>
          <a
            href="/theme-generator"
            className="btn btn-ghost btn-sm btn-block justify-start"
          >
            Create Theme
          </a>
        </li>
      </ul>
    </div>
  );
}
