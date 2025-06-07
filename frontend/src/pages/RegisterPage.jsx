import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { register } from '../api/auth';
import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
    const navigate = useNavigate();

    const handleSubmit = async ({ username, email, password }) => {
        try {
            await register(username, email, password);
            toast.success('Registration successful! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.message || 'Registration failed. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center text-amber-900">
            <div className="bg-white/80 border border-amber-700 rounded shadow-xl p-8 w-full max-w-md backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-center text-amber-900 mb-6">Register</h1>
                <AuthForm onSubmit={handleSubmit} showEmail={true} submitLabel="Register" />
            </div>
        </div>
    );
}