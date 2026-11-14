import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Menu, User, X } from "lucide-react";

import { clearTokens } from "@/lib/tokenStore";
import { useAuth } from "@/hooks/useAuth";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";

const navLinkClass = ({ isActive }) =>
    cn(
        "rounded-md px-1 py-1 transition-colors duration-200 hover:text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
        isActive && "text-accent-primary underline"
    );

const mobileLinkClass =
    "px-4 py-3 text-sm font-medium text-text-heading transition-colors hover:bg-state-hover focus-visible:outline-none focus-visible:bg-state-hover";

export default function Navbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useClickOutside(menuRef, () => setMobileMenuOpen(false), mobileMenuOpen);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileMenuOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === "Escape") setMobileMenuOpen(false);
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        clearTokens();
        setMobileMenuOpen(false);
        navigate("/");
    };

    return (
        <nav className="fixed left-0 top-0 z-50 w-full border-b border-border-default bg-surface-panel/90 shadow-md backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3">
                <div className="flex items-center gap-3 md:gap-6">
                    <Link
                        to="/"
                        className="flex items-center transition duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                    >
                        <img
                            src={logo}
                            alt={t("navbar.logoAlt")}
                            width={256}
                            height={256}
                            className="h-10 w-auto md:h-14"
                        />
                    </Link>

                    {isAuthenticated && (
                        <div className="hidden md:flex md:items-center md:gap-6 md:text-lg md:font-semibold md:text-text-heading">
                            <NavLink to="/profile" className={navLinkClass}>
                                {t("navbar.profile")}
                            </NavLink>
                        </div>
                    )}
                </div>

                <div className="hidden items-center gap-2 text-lg font-semibold text-text-heading md:flex">
                    <LanguageToggle />
                    <div className="h-6 w-px bg-border-default/40" aria-hidden="true" />
                    <ThemeToggle />
                    <div className="h-6 w-px bg-border-default/40" aria-hidden="true" />

                    {!isAuthenticated ? (
                        <>
                            <NavLink to="/login" className={navLinkClass}>
                                {t("navbar.login")}
                            </NavLink>
                            <NavLink to="/register" className={navLinkClass}>
                                {t("navbar.register")}
                            </NavLink>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors duration-200 hover:text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            {t("navbar.logout")}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 md:hidden" ref={menuRef}>
                    <LanguageToggle compact />
                    <ThemeToggle compact />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen((value) => !value)}
                        className="h-9 w-9 rounded-xl border border-border-default/40 bg-surface-page/30 text-text-heading hover:bg-surface-page/50 hover:text-accent-primary"
                        aria-label={
                            mobileMenuOpen
                                ? t("navbar.closeMenu")
                                : t("navbar.openMenu")
                        }
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-navigation"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Menu className="h-4 w-4" aria-hidden="true" />
                        )}
                    </Button>

                    {mobileMenuOpen && (
                        <div
                            id="mobile-navigation"
                            className="absolute right-3 top-[calc(100%+8px)] w-52 overflow-hidden rounded-xl border border-border-default/40 bg-surface-panel/95 shadow-card backdrop-blur-sm"
                        >
                            <div className="flex flex-col py-1">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className={cn(mobileLinkClass, "inline-flex items-center gap-2")}
                                        >
                                            <User className="h-4 w-4" aria-hidden="true" />
                                            {t("navbar.profile")}
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className={cn(
                                                mobileLinkClass,
                                                "inline-flex items-center gap-2 text-left"
                                            )}
                                        >
                                            <LogOut className="h-4 w-4" aria-hidden="true" />
                                            {t("navbar.logout")}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className={mobileLinkClass}>
                                            {t("navbar.login")}
                                        </Link>

                                        <Link to="/register" className={mobileLinkClass}>
                                            {t("navbar.register")}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
