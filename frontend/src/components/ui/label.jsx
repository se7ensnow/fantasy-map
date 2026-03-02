import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
    "text-sm font-medium leading-none",
    {
        variants: {
            variant: {
                default: "text-text-heading",
                muted: "text-text-heading/70",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Label = React.forwardRef(
    ({ className, variant, ...props }, ref) => (
        <LabelPrimitive.Root
            ref={ref}
            className={cn(
                labelVariants({ variant }),
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className
            )}
            {...props}
        />
    )
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };