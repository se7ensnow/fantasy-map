import { Link, useNavigate } from 'react-router-dom';
import { getToken, clearToken } from '../api/auth';
import logo from '../assets/fantasy_maps_logo.png';

export default function Navbar() {
    const navigate = useNavigate();
    const token = getToken()

    const handleLogout = () => {
        clearToken();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[rgba(252,247,233,0.9)] border-b border-amber-700 shadow-md">
            <div className="flex justify-between items-center px-6 py-3">
                <div className="flex items-center space-x-6">
                    <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition duration-200">
                        <img src={logo} alt="Fantasy Maps Logo" className="h-14 w-auto" />
                    </Link>

                    <div className="flex space-x-6 text-lg font-semibold text-amber-900 ml-4">
                        {token && (
                            <Link
                                to="/profile"
                                className="hover:text-green-700 hover:underline transition duration-200"
                            >
                                Profile
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex space-x-4 text-lg font-semibold text-amber-900">
                    {!token ? (
                        <>
                            <Link
                                to="/login"
                                className="hover:text-green-700 hover:underline transition duration-200"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="hover:text-green-700 hover:underline transition duration-200"
                            >
                                Register
                            </Link>
                        </>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="hover:text-green-700 hover:underline transition duration-200"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}