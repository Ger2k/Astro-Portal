import { cva, type VariantProps } from "class-variance-authority";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@shared/lib/cn";

const selectVariants = cva(
  "h-10 w-full rounded-[var(--radius-md)] border bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-foreground)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      tone: {
        default: "border-[color:var(--color-input)]",
        danger: "border-[color:var(--color-danger)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

export function Select({ className, children, tone, ...props }: SelectProps) {
  return (
    <select className={cn(selectVariants({ tone }), className)} {...props}>
      {children}
    </select>
  );
}
