import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import ScrollToTop from "@/components/ScrollToTop";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import MapEditPage from "@/pages/MapEditPage";
import MapPage from "@/pages/MapPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage";
import RegisterPage from "@/pages/RegisterPage";
import SharedMapPage from "@/pages/SharedMapPage";

export default function App() {
    const { t } = useTranslation();

    return (
        <Router>
            <ScrollToTop />

            <div className="flex min-h-screen flex-col">
                <a
                    href="#main-content"
                    className="sr-only rounded-md bg-accent-primary px-4 py-2 text-text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
                >
                    {t("a11y.skipToContent")}
                </a>

                <Navbar />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 px-2 pt-16 outline-none md:px-6 md:pt-20"
                >
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route
                            path="/profile"
                            element={
                                <RequireAuth>
                                    <ProfilePage />
                                </RequireAuth>
                            }
                        />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/maps/:map_id" element={<MapPage />} />
                        <Route
                            path="/maps/share/:share_id"
                            element={<SharedMapPage />}
                        />
                        <Route
                            path="/maps/new"
                            element={
                                <RequireAuth>
                                    <MapEditPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/maps/:map_id/edit"
                            element={
                                <RequireAuth>
                                    <MapEditPage />
                                </RequireAuth>
                            }
                        />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}
