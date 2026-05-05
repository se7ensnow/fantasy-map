import React from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function LocationDetails({ location }) {
    return (
        <div
            className="
                rounded-xl border-2 border-border-default
                bg-surface-panel/95 p-5 shadow-md
            "
        >
            <MarkdownRenderer content={location.description_md} />
        </div>
    );
}