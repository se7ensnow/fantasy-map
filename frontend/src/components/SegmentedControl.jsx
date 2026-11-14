import { cn } from "@/lib/utils";

/**
 * Small accessible segmented control used for visibility/tab switches.
 */
export default function SegmentedControl({
    options,
    value,
    onChange,
    label,
    className,
    size = "md",
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className={cn(
                "inline-flex overflow-hidden rounded-lg border border-border-default/50 bg-surface-paper/60",
                className
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        title={option.title}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary/50",
                            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
                            isActive
                                ? "bg-state-selected font-semibold text-text-heading"
                                : "text-text-heading/70 hover:bg-state-hover"
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
