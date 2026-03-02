import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
    "rounded-lg",
    {
        variants: {
            variant: {
                ghost: "bg-transparent border border-transparent shadow-none",
                surface: "bg-surface-panel/95 border border-border-default/30 shadow-sm",
                outline: "bg-transparent border border-border-default/30 shadow-none",
            },
            padding: {
                none: "",
                default: "",
            },
        },
        defaultVariants: {
            variant: "ghost",
            padding: "default",
        },
    }
);

const Card = React.forwardRef(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(cardVariants({ variant }), "text-text-primary", className)}
        {...props}
    />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-2xl font-semibold leading-none tracking-tight text-text-heading", className)}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-text-heading/70", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };