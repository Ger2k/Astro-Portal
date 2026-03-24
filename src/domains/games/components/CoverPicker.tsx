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
  const [results, setResults] = useState<CoverOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const normalizedTitle = suggestedTitle.trim();

  useEffect(() => {
    if (normalizedTitle.length < 2) {
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
        const response = await fetch(`/api/rawg-cover?query=${encodeURIComponent(normalizedTitle)}`, {
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
  }, [normalizedTitle, refreshTick]);

  const selectedResultId = useMemo(() => {
    if (!value.trim()) return null;
    const selected = results.find((item) => item.image === value.trim());
    return selected?.id ?? null;
  }, [results, value]);

  const canSearch = normalizedTitle.length >= 2;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Busqueda automatica con el titulo: <span className="font-medium text-foreground">{normalizedTitle || "(vacio)"}</span>
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setRefreshTick((v) => v + 1)}
          disabled={disabled || !canSearch || isLoading}
        >
          {isLoading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {!canSearch ? (
        <p className="text-sm text-muted-foreground">
          Escribe al menos 2 letras en el campo Titulo para buscar portadas.
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-muted-foreground">Buscando portadas...</p> : null}

      {error ? (
        <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && canSearch && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No encontramos portadas para ese titulo.</p>
      ) : null}

      {!isLoading && results.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {results.map((option) => {
            const isSelected = selectedResultId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.image)}
                disabled={disabled}
                className={[
                  "w-24 shrink-0 overflow-hidden rounded-lg border text-left transition",
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
                <div className="space-y-0.5 p-1.5">
                  <p className="line-clamp-1 text-[11px] font-semibold text-foreground">{option.title}</p>
                  <p className="line-clamp-1 text-[10px] text-muted-foreground">
                    {releaseYear(option.released)}
                    {option.platforms.length > 0 ? ` · ${option.platforms[0]}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_56px]">
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
          <img
            src={value}
            alt="Vista previa de portada"
            className="h-20 w-14 rounded object-cover ring-1 ring-border"
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground ring-1 ring-border">
            Sin
          </div>
        )}
      </div>
    </div>
  );
}
