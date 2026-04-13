import { useCallback, useMemo, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@shared/lib/cn";

const toastVariants = cva(
  "pointer-events-auto flex min-w-72 items-start justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm shadow-md",
  {
    variants: {
      variant: {
        info: "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)]",
        success: "state-success-panel",
        error: "state-danger-panel",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

export interface ToastMessage extends VariantProps<typeof toastVariants> {
  id: string;
  title: string;
  description?: string;
  iconUrl?: string;
  iconAlt?: string;
}

interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={cn(toastVariants({ variant: toast.variant }), "toast-enter")}
          role="status"
        >
          <div className="flex items-start gap-3">
            {toast.iconUrl ? (
              <img
                src={toast.iconUrl}
                alt={toast.iconAlt ?? "Icono del mensaje"}
                className="mt-0.5 h-8 w-8 rounded-md border border-border/60 bg-surface object-cover"
                loading="lazy"
              />
            ) : null}

            <div className="space-y-1">
              <p className="font-semibold">{toast.title}</p>
              {toast.description ? <p className="text-xs opacity-90">{toast.description}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="state-panel-action rounded px-2 py-1 text-xs"
            aria-label="Cerrar mensaje"
          >
            Cerrar
          </button>
        </article>
      ))}
    </div>
  );
}

export function useToast(timeout = 4000) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), timeout);
    },
    [dismiss, timeout],
  );

  return useMemo(
    () => ({
      toasts,
      push,
      dismiss,
    }),
    [toasts, push, dismiss],
  );
}
