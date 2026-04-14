import type { ComponentProps } from "react";
import { Handle } from "@xyflow/react";

import { cn } from "@/lib/utils";

export type BaseHandleProps = ComponentProps<typeof Handle> & {
  /** Invisible anchor for programmatic edges only (React Flow skill: use opacity, not display:none). */
  invisible?: boolean;
};

export function BaseHandle({
  className,
  children,
  invisible,
  ...props
}: BaseHandleProps) {
  return (
    <Handle
      {...props}
      className={cn(
        invisible
          ? "h-4 w-4 !border-0 !bg-transparent opacity-0"
          : "dark:border-secondary dark:bg-secondary h-[11px] w-[11px] rounded-full border border-slate-300 bg-slate-100 transition",
        className,
      )}
    >
      {children}
    </Handle>
  );
}
