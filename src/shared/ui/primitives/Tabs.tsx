import type { ReactNode } from "react";
import { cn } from "@shared/lib/cn";

interface TabsProps {
  value: string;
  onValueChange: (next: string) => void;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  currentValue: string;
  onSelect: (next: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("space-y-3", className)} data-tabs-value={value} data-tabs-onchange={Boolean(onValueChange)}>
      {children}
    </div>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return <div className={cn("inline-flex rounded-lg border border-border bg-muted p-1", className)}>{children}</div>;
}

export function TabsTrigger({ value, currentValue, onSelect, children, className }: TabsTriggerProps) {
  const active = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
