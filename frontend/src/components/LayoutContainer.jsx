import React from "react";
import { cn } from "@/lib/utils";

export default function LayoutContainer({ className = "", children }) {
    return (
        <div className={cn("mx-auto w-full max-w-[2400px]", className)}>
            {children}
        </div>
    );
}