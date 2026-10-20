import type { ReactNode } from "react";

type Props = { title: string; description?: string; children?: ReactNode };

/** Encadré affiché quand une liste ou un graphique n'a rien à montrer ; `children` = actions possibles. */
export function EmptyState({ title, description, children }: Props) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
