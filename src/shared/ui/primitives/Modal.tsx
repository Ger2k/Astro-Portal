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

export function Modal({ isOpen, title, description, onClose, children, showCloseButton = true }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
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
        className={cn("surface-card relative z-10 w-full max-w-lg p-5")}
      >
        <header className="space-y-2">
          <h2 id="modal-title" className="text-xl font-semibold text-foreground">
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
