import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { getToken, clearToken } from "../api/auth";
import logo from "../assets/fantasy_maps_logo_2.png";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = getToken();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        clearToken();
        setMobileMenuOpen(false);
        navigate("/");
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(event.target)) {
                setMobileMenuOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setMobileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="fixed left-0 top-0 z-50 w-full border-b border-border-default bg-surface-panel/90 shadow-md backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3">
                <div className="flex items-center gap-3 md:gap-6">
                    <Link
                        to="/"
                        className="flex items-center transition duration-200 hover:opacity-80"
                        onClick={closeMobileMenu}
                    >
                        <img
                            src={logo}
                            alt="Fantasy Maps Logo"
                            className="h-10 w-auto md:h-14"
                        />
                    </Link>

                    {token && (
                        <div className="hidden md:flex md:items-center md:gap-6 md:text-lg md:font-semibold md:text-text-heading">
                            <Link
                                to="/profile"
                                className="transition duration-200 hover:text-accent-primary hover:underline"
                            >
                                {t("navbar.profile")}
                            </Link>
                        </div>
                    )}
                </div>

                <div className="hidden items-center gap-2 text-lg font-semibold text-text-heading md:flex">
                    <LanguageToggle />
                    <div className="h-6 w-px bg-border-default/40" />
                    <ThemeToggle />
                    <div className="h-6 w-px bg-border-default/40" />

                    {!token ? (
                        <>
                            <Link
                                to="/login"
                                className="transition duration-200 hover:text-accent-primary hover:underline"
                            >
                                {t("navbar.login")}
                            </Link>
                            <Link
                                to="/register"
                                className="transition duration-200 hover:text-accent-primary hover:underline"
                            >
                                {t("navbar.register")}
                            </Link>
                        </>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="transition duration-200 hover:text-accent-primary hover:underline"
                        >
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
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="h-9 w-9 rounded-xl border border-border-default/40 bg-surface-page/30 text-text-heading hover:bg-surface-page/50 hover:text-accent-primary"
                        aria-label={
                            mobileMenuOpen
                                ? t("navbar.closeMenu", "Close menu")
                                : t("navbar.openMenu", "Open menu")
                        }
                        title={
                            mobileMenuOpen
                                ? t("navbar.closeMenu", "Close menu")
                                : t("navbar.openMenu", "Open menu")
                        }
                    >
                        {mobileMenuOpen ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Menu className="h-4 w-4" />
                        )}
                    </Button>

                    {mobileMenuOpen && (
                        <div
                            className="
                                absolute right-3 top-[calc(100%+8px)] w-52 overflow-hidden rounded-xl
                                border border-border-default/40 bg-surface-panel/95 shadow-card backdrop-blur-sm
                            "
                        >
                            <div className="flex flex-col py-1">
                                {token ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            onClick={closeMobileMenu}
                                            className="px-4 py-3 text-sm font-medium text-text-heading transition-colors hover:bg-state-hover"
                                        >
                                            {t("navbar.profile")}
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="px-4 py-3 text-left text-sm font-medium text-text-heading transition-colors hover:bg-state-hover"
                                        >
                                            {t("navbar.logout")}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            onClick={closeMobileMenu}
                                            className="px-4 py-3 text-sm font-medium text-text-heading transition-colors hover:bg-state-hover"
                                        >
                                            {t("navbar.login")}
                                        </Link>

                                        <Link
                                            to="/register"
                                            onClick={closeMobileMenu}
                                            className="px-4 py-3 text-sm font-medium text-text-heading transition-colors hover:bg-state-hover"
                                        >
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