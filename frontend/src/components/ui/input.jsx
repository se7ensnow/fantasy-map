import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-md border px-3 py-2 text-base md:text-sm",
                "bg-surface-input text-text-primary",
                "border-border-default/30",
                "placeholder:text-text-heading/60",
                "ring-offset-surface-page",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-default/40 focus-visible:ring-offset-2",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export { Input };