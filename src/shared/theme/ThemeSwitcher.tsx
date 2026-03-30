import { useEffect, useRef, useState } from "react";

const THEME_STORAGE_KEY = "portal-theme";

const THEMES = [
  {
    id: "forest",
    label: "Bosque",
    swatches: ["#0f766e", "#d7f3ea", "#f6fbf7"],
  },
  {
    id: "sand",
    label: "Arena",
    swatches: ["#b45309", "#fce7c7", "#fffaf2"],
  },
  {
    id: "cobalt",
    label: "Cobalto Noche",
    swatches: ["#60a5fa", "#1e293b", "#0f172a"],
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

function SwatchIcon({ swatches, size = "sm" }: { swatches: readonly string[]; size?: "sm" | "md" }) {
  const dims = size === "md" ? "h-5 w-5" : "h-4 w-4 sm:h-5 sm:w-5";
  return (
    <span className={`flex overflow-hidden rounded-full ring-1 ring-black/5 ${dims}`}>
      {swatches.map((swatch) => (
        <span
          key={swatch}
          className="h-full flex-1"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>("cobalt");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const domTheme = document.documentElement.dataset.theme ?? null;
    if (isThemeId(domTheme)) {
      setActiveTheme(domTheme);
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) {
      document.documentElement.dataset.theme = stored;
      setActiveTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [isOpen]);

  function applyTheme(themeId: ThemeId) {
    document.documentElement.dataset.theme = themeId;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    setActiveTheme(themeId);
    setIsOpen(false);
  }

  const activeThemeData = THEMES.find((t) => t.id === activeTheme) ?? THEMES[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground bg-surface shadow-sm transition sm:h-9 sm:w-9"
        aria-label={`Tema: ${activeThemeData.label}. Cambiar estilo`}
        aria-expanded={isOpen}
        title={`Estilo: ${activeThemeData.label}`}
      >
        <SwatchIcon swatches={activeThemeData.swatches} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 flex flex-col gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
          {THEMES.map((theme) => {
            const isActive = theme.id === activeTheme;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => applyTheme(theme.id)}
                className={[
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition whitespace-nowrap",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <SwatchIcon swatches={theme.swatches} size="md" />
                {theme.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
