import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@shared/ui/primitives";

interface CoverOption {
  id: number;
  title: string;
  released: string | null;
  image: string;
  platforms: string[];
}

interface CoverPickerProps {
  suggestedTitle: string;
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
}

function releaseYear(date: string | null) {
  if (!date) return "-";
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? "-" : String(year);
}

export function CoverPicker({ suggestedTitle, value, onChange, disabled }: CoverPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoverOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setQuery(suggestedTitle);
    }
  }, [suggestedTitle]);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/rawg-cover?query=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          ok: boolean;
          data?: CoverOption[];
          errorMessage?: string;
        };

        if (!response.ok || !payload.ok) {
          setResults([]);
          setError(payload.errorMessage ?? "No se pudo buscar en RAWG.");
          return;
        }

        setResults(payload.data ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }

        setResults([]);
        setError("No se pudo conectar para buscar portadas.");
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, refreshTick]);

  const selectedResultId = useMemo(() => {
    if (!value.trim()) return null;
    const selected = results.find((item) => item.image === value.trim());
    return selected?.id ?? null;
  }, [results, value]);

  const hasQuery = query.trim().length >= 2;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">Buscar portada en RAWG</label>
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Ej. Elden Ring"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            aria-label="Buscar portada del juego"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRefreshTick((v) => v + 1)}
            disabled={disabled || !hasQuery || isLoading}
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Escribe al menos 2 letras para obtener sugerencias automaticas.
        </p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Buscando portadas...</p> : null}

      {error ? (
        <p className="rounded-md border border-danger bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && hasQuery && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No encontramos portadas para ese titulo.</p>
      ) : null}

      {!isLoading && results.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {results.map((option) => {
            const isSelected = selectedResultId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.image)}
                disabled={disabled}
                className={[
                  "overflow-hidden rounded-lg border text-left transition",
                  isSelected
                    ? "border-primary ring-2 ring-ring"
                    : "border-border hover:border-foreground/40",
                ].join(" ")}
                aria-pressed={isSelected}
              >
                <img
                  src={option.image}
                  alt={`Portada de ${option.title}`}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-0.5 p-2">
                  <p className="line-clamp-1 text-xs font-semibold text-foreground">{option.title}</p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                    {releaseYear(option.released)}
                    {option.platforms.length > 0 ? ` · ${option.platforms[0]}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">URL de portada (manual)</label>
        <Input
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      {value.trim() ? (
        <div className="rounded-lg border border-border bg-muted/35 p-2">
          <p className="mb-2 text-xs text-muted-foreground">Portada seleccionada</p>
          <img
            src={value}
            alt="Vista previa de portada"
            className="h-36 w-24 rounded object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
    </div>
  );
}
