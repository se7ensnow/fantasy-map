import { Link, useNavigate } from "react-router-dom";
// import { toast } from "sonner";
import { getToken, clearToken } from "../api/auth";
import logo from "../assets/fantasy_maps_logo.png";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
    const navigate = useNavigate();
    const token = getToken();

    const handleLogout = () => {
        clearToken();
        navigate("/");
    };

//    const handleTestToasts = () => {
//        toast.success("Success toast", {
//            description: "This is how a success notification looks in the current theme.",
//        });
//
//        setTimeout(() => {
//            toast.error("Error toast", {
//                description: "This is how an error notification looks in the current theme.",
//            });
//        }, 250);
//
//        setTimeout(() => {
//            toast.warning("Warning toast", {
//                description: "This is how a warning notification looks in the current theme.",
//            });
//        }, 500);
//
//        setTimeout(() => {
//            toast.info("Info toast", {
//                description: "This is how an info notification looks in the current theme.",
//            });
//        }, 750);
//    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-surface-panel/90 border-b border-border-default shadow-md">
            <div className="flex justify-between items-center px-6 py-3">
                <div className="flex items-center space-x-6">
                    <Link
                        to="/"
                        className="flex items-center space-x-3 hover:opacity-80 transition duration-200"
                    >
                        <img src={logo} alt="Fantasy Maps Logo" className="h-14 w-auto" />
                    </Link>

                    <div className="flex space-x-6 text-lg font-semibold text-text-heading ml-4">
                        {token && (
                            <Link
                                to="/profile"
                                className="hover:text-accent-primary hover:underline transition duration-200"
                            >
                                Profile
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-lg font-semibold text-text-heading">
                    {/* <button
                        type="button"
                        onClick={handleTestToasts}
                        className="rounded-md border border-border-default px-3 py-1.5 text-base text-text-heading transition duration-200 hover:text-accent-primary hover:border-accent-primary hover:bg-state-hover"
                    >
                        Test Toasts
                    </button> */}

                    <ThemeToggle />
                    <div className="h-6 w-px bg-border-default/40" />
                    {!token ? (
                        <>
                            <Link
                                to="/login"
                                className="hover:text-accent-primary hover:underline transition duration-200"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="hover:text-accent-primary hover:underline transition duration-200"
                            >
                                Register
                            </Link>
                        </>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="hover:text-accent-primary hover:underline transition duration-200"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}