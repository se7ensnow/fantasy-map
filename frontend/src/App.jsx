import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage.jsx";
import MapEditPage from "./pages/MapEditPage.jsx";
import SharedMapPage from "@/pages/SharedMapPage";

import Footer from "@/components/Footer";

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col">
                <Navbar />

                <main className="flex-1 pt-20 px-6">
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
                        <Route path="/maps/share/:share_id" element={<SharedMapPage />} />
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
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;