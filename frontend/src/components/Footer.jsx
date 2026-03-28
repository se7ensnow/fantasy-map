import React from "react";

export default function Footer() {
    return (
        <footer className="border-t border-border-default/30 bg-surface-panel/70">
            <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-3 text-xs text-text-muted">
                <p className="text-center">
                    Fantasy Maps © 2026
                    <span className="mx-1"> | </span>
                    Contact:{" "}
                    <a
                        href="mailto:art.lazar.ig@gmail.com"
                        className="transition-colors duration-200 hover:text-text-heading underline-offset-2 hover:underline"
                    >
                        art.lazar.ig@gmail.com
                    </a>
                </p>
            </div>
        </footer>
    );
}