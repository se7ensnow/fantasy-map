import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../api/auth';
import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
    const navigate= useNavigate();

    const handleSubmit = async ({ username, password }) => {
        try {
            await login(username, password);
            toast.success('Logged in successfully!');
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center text-amber-900">
            <div className="bg-white/80 border border-amber-700 rounded shadow-xl p-8 w-full max-w-md backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-center text-amber-900 mb-6">Login</h1>
                <AuthForm onSubmit={handleSubmit} submitLabel="Login" />
            </div>
        </div>
    );
}