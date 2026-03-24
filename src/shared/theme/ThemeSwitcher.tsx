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
    label: "Cobalto Noche",
    swatches: ["#60a5fa", "#1e293b", "#0f172a"],
  },
  {
    id: "sand",
    label: "Arena",
    swatches: ["#b45309", "#fce7c7", "#fffaf2"],
  },
  {
    id: "coral",
    label: "Coral Nocturno",
    swatches: ["#fb7185", "#3b1020", "#140810"],
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
    <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Estilo
      </span>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-start">
        {THEMES.map((theme) => {
          const isActive = theme.id === activeTheme;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => applyTheme(theme.id)}
              className={[
                "group relative flex h-8 w-8 items-center justify-center rounded-full border transition sm:h-9 sm:w-9",
                isActive
                  ? "border-foreground bg-surface shadow-sm"
                  : "border-border bg-surface/80 hover:border-foreground/40",
              ].join(" ")}
              aria-label={`Cambiar tema a ${theme.label}`}
              aria-pressed={isActive}
              title={theme.label}
            >
              <span className="sr-only">{theme.label}</span>
              <span className="flex h-4 w-4 overflow-hidden rounded-full ring-1 ring-black/5 sm:h-5 sm:w-5">
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
