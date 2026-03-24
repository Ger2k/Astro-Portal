import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "portal-theme";

const THEMES = [
  {
    id: "forest",
    label: "Bosque",
    swatches: ["#0f766e", "#d7f3ea", "#f6fbf7"],
  },
  {
    id: "cobalt",
    label: "Cobalto",
    swatches: ["#1d4ed8", "#dbeafe", "#f8fbff"],
  },
  {
    id: "sand",
    label: "Arena",
    swatches: ["#b45309", "#fce7c7", "#fffaf2"],
  },
  {
    id: "coral",
    label: "Coral",
    swatches: ["#e11d48", "#ffe1e8", "#fff8f8"],
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>("forest");

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme;
    if (isThemeId(currentTheme ?? null)) {
      setActiveTheme(currentTheme);
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) {
      document.documentElement.dataset.theme = stored;
      setActiveTheme(stored);
    }
  }, []);

  function applyTheme(themeId: ThemeId) {
    document.documentElement.dataset.theme = themeId;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    setActiveTheme(themeId);
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Estilo
      </span>

      <div className="flex items-center gap-2">
        {THEMES.map((theme) => {
          const isActive = theme.id === activeTheme;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => applyTheme(theme.id)}
              className={[
                "group relative flex h-9 w-9 items-center justify-center rounded-full border transition",
                isActive
                  ? "border-foreground bg-surface shadow-sm"
                  : "border-border bg-surface/80 hover:border-foreground/40",
              ].join(" ")}
              aria-label={`Cambiar tema a ${theme.label}`}
              aria-pressed={isActive}
              title={theme.label}
            >
              <span className="sr-only">{theme.label}</span>
              <span className="flex h-5 w-5 overflow-hidden rounded-full ring-1 ring-black/5">
                {theme.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="h-full flex-1"
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                  />
                ))}
              </span>
              {isActive ? (
                <span
                  className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-surface bg-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
