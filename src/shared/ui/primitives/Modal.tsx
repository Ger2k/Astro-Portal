import { useEffect, type ReactNode } from "react";
import { Button } from "@shared/ui/primitives/Button";
import { cn } from "@shared/lib/cn";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        className={cn("surface-card relative z-10 mx-auto w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:max-h-[calc(100dvh-3rem)] sm:p-5")}
      >
        <header className="space-y-2">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p id="modal-description" className="text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>

        <div className="mt-4">{children}</div>

        {showCloseButton ? (
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
