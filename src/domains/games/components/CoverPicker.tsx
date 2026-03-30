import { useMemo, useRef, useState } from "react";
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
  positionX?: number;
  positionY?: number;
  onPositionChange?: (x: number, y: number) => void;
  disabled?: boolean;
}

function releaseYear(date: string | null) {
  if (!date) return "-";
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? "-" : String(year);
}

function DraggableCoverPreview({
  src,
  positionX,
  positionY,
  onPositionChange,
}: {
  src: string;
  positionX: number;
  positionY: number;
  onPositionChange: (x: number, y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    containerRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: positionX,
      originY: positionY,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const el = containerRef.current;
    if (!drag || !el) return;

    const rect = el.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;

    onPositionChange(
      Math.round(Math.min(100, Math.max(0, drag.originX - dx))),
      Math.round(Math.min(100, Math.max(0, drag.originY - dy))),
    );
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    containerRef.current?.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-muted-foreground">
        Arrastra la imagen para ajustar el encuadre:
      </p>
      <div
        ref={containerRef}
        className="relative h-40 w-28 cursor-move overflow-hidden rounded-lg ring-1 ring-border select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={src}
          alt="Arrastra para reposicionar la portada"
          className="pointer-events-none h-full w-full object-cover"
          style={{ objectPosition: `${positionX}% ${positionY}%` }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export function CoverPicker({ suggestedTitle, value, onChange, positionX = 50, positionY = 50, onPositionChange, disabled }: CoverPickerProps) {
  const [results, setResults] = useState<CoverOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedTitle = suggestedTitle.trim();

  async function handleSearch() {
    if (normalizedTitle.length < 2 || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rawg-cover?query=${encodeURIComponent(normalizedTitle)}`);

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
    } catch (error) {
      console.error("[CoverPicker] Search failed:", error);
      setResults([]);
      setError("No se pudo conectar para buscar portadas.");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedResultId = useMemo(() => {
    if (!value.trim()) return null;
    const selected = results.find((item) => item.image === value.trim());
    return selected?.id ?? null;
  }, [results, value]);

  const canSearch = normalizedTitle.length >= 2;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Buscar portada para: <span className="font-medium text-foreground">{normalizedTitle || "(vacio)"}</span>
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleSearch()}
          disabled={disabled || !canSearch || isLoading}
        >
          {isLoading ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Selecciona una portada de los resultados o pega una URL manual.
      </p>

      <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_56px]">
        <Input
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label="URL de portada"
        />

        {value.trim() ? (
          <img
            src={value}
            alt="Vista previa de portada"
            className="h-20 w-14 rounded object-cover ring-1 ring-border"
            style={{ objectPosition: `${positionX}% ${positionY}%` }}
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground ring-1 ring-border">
            Sin
          </div>
        )}
      </div>

      {value.trim() && onPositionChange ? (
        <DraggableCoverPreview
          src={value}
          positionX={positionX}
          positionY={positionY}
          onPositionChange={onPositionChange}
        />
      ) : null}

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
    </div>
  );
}
