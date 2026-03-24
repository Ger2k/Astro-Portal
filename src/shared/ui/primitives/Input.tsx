import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes } from "react";
import { cn } from "@shared/lib/cn";

const inputVariants = cva(
  "h-10 w-full rounded-[var(--radius-md)] border bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-foreground)] shadow-sm transition placeholder:text-[color:var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60",
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

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export function Input({ className, tone, ...props }: InputProps) {
  return <input className={cn(inputVariants({ tone }), className)} {...props} />;
}

export { inputVariants };
