import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@shared/ui/primitives/Button";
import { cn } from "@shared/lib/cn";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

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
  const dialogRef = useRef<HTMLElement>(null);
  // Ref pattern: keeps onClose current without adding it to the stable effect deps
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog on open
    const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      // Re-query on each Tab press to handle dynamic content (e.g. "Otro" platform input)
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // Restore focus to the element that triggered the modal
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center px-3 py-6 sm:px-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />

      <section
        ref={dialogRef}
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
