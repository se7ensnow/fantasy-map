import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export default function LoadingState({ label, className, compact = false }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "flex items-center justify-center gap-3 text-text-primary",
                compact ? "py-4" : "min-h-[40vh] py-10",
                className
            )}
        >
            <Spinner />
            <span className={compact ? "text-sm" : "text-base"}>{label}</span>
        </div>
    );
}
