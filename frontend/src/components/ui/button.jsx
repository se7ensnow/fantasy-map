import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-accent-primary text-text-on-accent hover:bg-accent-primary-hover",
                destructive: "bg-status-danger text-text-on-accent hover:bg-status-danger-hover",
                outline:
                    "border border-accent-primary text-accent-primary hover:bg-accent-primary-hover hover:text-text-on-accent",
                secondary:
                    "border border-border-emphasis text-text-primary hover:bg-surface-page",
                ghost: "hover:bg-surface-panel/60",
                link: "text-text-link underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(
                    buttonVariants({ variant, size }),
                    // rings aligned with our design system
                    "ring-offset-surface-page focus-visible:ring-border-default/40",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };