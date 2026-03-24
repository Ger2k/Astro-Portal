import { useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { addGameForUser } from "@domains/games/services/completedGamesService";
import type { NewGameInput } from "@domains/games/types/completedGame";
import { Button, Input, Modal, ToastViewport, useToast } from "@shared/ui/primitives";
import { CoverPicker } from "@domains/games/components/CoverPicker";

const PLATFORM_OPTIONS = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X/S",
  "Xbox One",
  "Nintendo Switch",
  "iOS",
  "Android",
  "Otro",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FORM: NewGameInput = {
  title: "",
  platform: "PC",
  date: todayISO(),
  score: 70,
  hours: null,
  cover: "",
  notes: "",
};

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface AddGameFormProps {
  onSuccess: () => void;
}

export function AddGameForm({ onSuccess }: AddGameFormProps) {
  const { user } = useAuthSession();
  const { toasts, push, dismiss } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<NewGameInput>(DEFAULT_FORM);
  const [customPlatform, setCustomPlatform] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomPlatform = form.platform === "Otro";

  function set<K extends keyof NewGameInput>(key: K, value: NewGameInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setIsOpen(false);
    setForm(DEFAULT_FORM);
    setCustomPlatform("");
    setError(null);
  }

  async function handleSubmit() {
    if (!user) return;

    const platformValue = isCustomPlatform ? customPlatform.trim() : form.platform;

    if (!form.title.trim()) {
      setError("El t├¡tulo es obligatorio.");
      return;
    }
    if (!platformValue) {
      setError("La plataforma es obligatoria.");
      return;
    }
    if (!form.date) {
      setError("La fecha es obligatoria.");
      return;
    }
    if (form.score !== null && (form.score < 0 || form.score > 100)) {
      setError("La puntuaci├│n debe estar entre 0 y 100.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let cover = form.cover.trim();
    if (!cover.startsWith("https://")) cover = "";
    if (!cover) {
      try {
        const res = await fetch(`/api/rawg-cover?title=${encodeURIComponent(form.title.trim())}`);
        const data = (await res.json()) as { images?: string[] };
        cover = data.images?.[0] ?? "";
      } catch {
        cover = "";
      }
    }

    const result = await addGameForUser(user.uid, {
      ...form,
      title: form.title.trim(),
      platform: platformValue,
      notes: form.notes.trim(),
      cover,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.errorMessage);
      push({
        variant: "error",
        title: "No se pudo guardar",
        description: result.errorMessage,
      });
      return;
    }

    setForm({ ...DEFAULT_FORM, date: todayISO() });
    setCustomPlatform("");
    setIsOpen(false);
    push({
      variant: "success",
      title: "Juego a├▒adido",
      description: "El juego se guard├│ correctamente.",
    });
    onSuccess();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setIsOpen(true)}>+ A├▒adir juego</Button>
      </div>

      <Modal
        isOpen={isOpen}
        title="A├▒adir juego completado"
        onClose={handleCancel}
        showCloseButton={false}
      >
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} noValidate className="space-y-4">
          {/* T├¡tulo */}
          <Field label="T├¡tulo" required>
            <Input
              type="text"
              placeholder="Ej. Elden Ring"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
            />
          </Field>

          {/* Plataforma */}
          <Field label="Plataforma" required>
            <select
              className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {isCustomPlatform ? (
              <Input
                type="text"
                placeholder="Escribe la plataforma"
                className="mt-2"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
              />
            ) : null}
          </Field>

          {/* Fecha */}
          <Field label="Fecha completado" required>
            <Input
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>

          {/* Puntuaci├│n slider */}
          <Field label="Puntuaci├│n">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={form.score ?? 0}
                onChange={(e) => set("score", Number(e.target.value))}
                className="flex-1 accent-primary"
                aria-label={`Puntuaci├│n: ${form.score ?? 0} de 100`}
              />
              <span className="w-9 text-right text-sm font-semibold tabular-nums text-foreground">
                {form.score ?? 0}
              </span>
            </div>
          </Field>

          {/* Horas */}
          <Field label="Horas jugadas" hint="Opcional">
            <Input
              type="number"
              placeholder="Ej. 120"
              min={0}
              value={form.hours ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                set("hours", v === "" ? null : Number(v));
              }}
            />
          </Field>

          {/* Portada */}
          <Field label="Portada" hint="Opcional ÔÇö busca autom├íticamente al guardar o pega una URL">
            <CoverPicker title={form.title} value={form.cover} onChange={(url) => set("cover", url)} />
          </Field>

          {/* Notas */}
          <Field label="Notas">
            <textarea
              className="min-h-20 w-full resize-y rounded-(--radius-md) border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Impresiones, puntos destacados..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </Field>

          {/* Error */}
          {error ? (
            <p className="rounded-md border border-danger bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </p>
          ) : null}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar juego"}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
