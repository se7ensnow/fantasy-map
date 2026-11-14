import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-border-default/30 bg-surface-panel/70">
            <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-3 text-xs text-text-muted">
                <p className="text-center">
                    {t("footer.brand")} © {new Date().getFullYear()}
                    <span className="mx-1" aria-hidden="true">
                        |
                    </span>
                    {t("footer.contactLabel")}{" "}
                    <a
                        href="mailto:art.lazar.ig@gmail.com"
                        className="underline-offset-2 transition-colors duration-200 hover:text-text-heading hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                    >
                        art.lazar.ig@gmail.com
                    </a>
                </p>
            </div>
        </footer>
    );
}
