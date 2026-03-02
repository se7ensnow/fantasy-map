import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            ref={ref}
            className={cn(
                "flex min-h-[80px] w-full rounded-md px-3 py-2 text-base md:text-sm",
                "bg-surface-input text-text-primary",
                "border border-border-default/30",
                "placeholder:text-text-heading/60",
                "ring-offset-surface-page",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-default/40 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
});
Textarea.displayName = "Textarea";

export { Textarea };