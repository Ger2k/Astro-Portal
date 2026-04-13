import { useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { addGameForUser } from "@domains/games/services/completedGamesService";
import { pushAchievementToast } from "@domains/games/lib/pushAchievementToast";
import { syncAchievementsForUser } from "@domains/games/lib/syncAchievementsForUser";
import { CoverPicker } from "@domains/games/components/CoverPicker";
import type { NewGameInput } from "@domains/games/types/completedGame";
import { Button, Input, Modal, ToastViewport, useToast } from "@shared/ui/primitives";

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
  coverPositionX: 50,
  coverPositionY: 50,
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
  triggerVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  triggerSize?: "sm" | "md" | "lg";
  triggerClassName?: string;
}

export function AddGameForm({
  onSuccess,
  triggerVariant = "primary",
  triggerSize = "md",
  triggerClassName,
}: AddGameFormProps) {
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
      setError("El título es obligatorio.");
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
      setError("La puntuación debe estar entre 0 y 100.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await addGameForUser(user.uid, {
      ...form,
      title: form.title.trim(),
      platform: platformValue,
      notes: form.notes.trim(),
      cover: form.cover.trim(),
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
      title: "Juego añadido",
      description: "El juego se guardó correctamente.",
    });

    const syncResult = await syncAchievementsForUser(user.uid);

    if (syncResult.ok && syncResult.unlockedNowCount > 0) {
      pushAchievementToast(push, syncResult.unlockedNow);
    }

    onSuccess();
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant={triggerVariant} size={triggerSize} className={triggerClassName}>
        + Añadir juego
      </Button>

      <Modal
        isOpen={isOpen}
        title="Añadir juego completado"
        onClose={handleCancel}
        showCloseButton={false}
      >
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} noValidate className="space-y-4">
          {/* Título */}
          <Field label="Título" required>
            <Input
              type="text"
              placeholder="Ej. Elden Ring"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
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
                value={form.date ?? ""}
                max={todayISO()}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Puntuación slider */}
            <Field label="Puntuación">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.score ?? 0}
                  onChange={(e) => set("score", Number(e.target.value))}
                  className="min-w-0 flex-1 accent-primary"
                  aria-label={`Puntuación: ${form.score ?? 0} de 100`}
                />
                <span className="w-9 text-right text-sm font-semibold tabular-nums text-foreground">
                  {form.score ?? 0}
                </span>
              </div>
            </Field>

            {/* Horas */}
            <Field label="Horas jugadas">
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
          </div>

          {/* Portada */}
          <Field label="Portada">
            <CoverPicker
              suggestedTitle={form.title}
              value={form.cover}
              onChange={(nextValue) => set("cover", nextValue)}
              positionX={form.coverPositionX}
              positionY={form.coverPositionY}
              onPositionChange={(x, y) => {
                setForm((prev) => ({ ...prev, coverPositionX: x, coverPositionY: y }));
              }}
              disabled={submitting}
            />
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
            <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          {/* Acciones */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Guardando..." : "Guardar juego"}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
