import { useState } from "react";
import { Button } from "@shared/ui/primitives";

/** Cache en memoria por título para evitar peticiones repetidas. */
const searchCache: Record<string, string[]> = {};

/** Elimina comillas/paréntesis envolventes. Solo valida https:// al guardar. */
function stripWrappers(raw: string): string {
  return raw.trim().replace(/^["'(]+|["')]+$/g, "");
}

export interface CoverPickerProps {
  title: string;
  value: string;
  onChange: (url: string) => void;
}

export function CoverPicker({ title, value, onChange }: CoverPickerProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    const trimmed = title.trim();
    if (!trimmed) {
      setStatus("Escribe un título primero.");
      return;
    }

    const wasEmpty = !value.trim();

    // Resultado en caché
    if (Object.prototype.hasOwnProperty.call(searchCache, trimmed)) {
      const cached = searchCache[trimmed];
      setThumbnails(cached);
      setStatus(
        cached.length > 0
          ? "Elige la portada correcta"
          : "No encontrada (usa URL manualmente o guarda y luego edita)",
      );
      if (cached.length > 0 && wasEmpty) onChange(cached[0]);
      return;
    }

    setLoading(true);
    setStatus("Buscando...");
    setThumbnails([]);

    try {
      const res = await fetch(`/api/rawg-cover?title=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as { images?: string[] };
      const imgs = data.images ?? [];

      searchCache[trimmed] = imgs;
      setThumbnails(imgs);

      if (imgs.length > 0) {
        setStatus("Elige la portada correcta");
        if (wasEmpty) onChange(imgs[0]);
      } else {
        setStatus("No encontrada (usa URL manualmente o guarda y luego edita)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setStatus(`Error al buscar la portada: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const preview = value.trim();

  return (
    <div className="space-y-3">
      {/* Input URL + botón buscar */}
      <div className="flex gap-2">
        <input
          type="url"
          className="h-10 flex-1 rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(stripWrappers(e.target.value))}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void search()}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar portada"}
        </Button>
      </div>

      {/* Estado */}
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}

      {/* Galería de thumbnails */}
      {thumbnails.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="listbox"
          aria-label="Portadas candidatas"
        >
          {thumbnails.map((url) => (
            <button
              key={url}
              type="button"
              role="option"
              aria-selected={value === url}
              onClick={() => onChange(url)}
              className={`shrink-0 overflow-hidden rounded border-2 transition-all ${
                value === url
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-border"
              }`}
            >
              <img
                src={url}
                alt="Portada candidata"
                width={80}
                height={112}
                className="h-28 w-20 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Preview de la URL seleccionada o escrita */}
      {preview ? (
        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-2">
          <img
            src={preview}
            alt="Preview de portada"
            width={48}
            height={68}
            className="h-17 w-12 shrink-0 rounded object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium text-foreground">Portada seleccionada</p>
            <p className="truncate text-xs text-muted-foreground">{preview}</p>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setThumbnails([]);
                setStatus(null);
              }}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Quitar portada
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
