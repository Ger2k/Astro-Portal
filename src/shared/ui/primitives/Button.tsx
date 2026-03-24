import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] hover:brightness-95",
        secondary:
          "bg-[color:var(--color-secondary)] text-[color:var(--color-secondary-foreground)] hover:brightness-95",
        outline:
          "border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]",
        ghost: "text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]",
        danger:
          "bg-[color:var(--color-danger)] text-[color:var(--color-danger-foreground)] hover:brightness-95",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, fullWidth, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props} />;
}

export { buttonVariants };
