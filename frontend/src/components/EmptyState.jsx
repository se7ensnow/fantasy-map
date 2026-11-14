import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}) {
    const Icon = icon || Compass;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-default/50 bg-surface-paper/40 px-4 py-10 text-center",
                className
            )}
        >
            <Icon
                className="h-8 w-8 text-text-muted/70"
                aria-hidden="true"
            />

            {title && (
                <h3 className="text-lg font-bold text-text-heading">{title}</h3>
            )}

            {description && (
                <p className="max-w-md text-sm leading-relaxed text-text-muted md:text-base">
                    {description}
                </p>
            )}

            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
