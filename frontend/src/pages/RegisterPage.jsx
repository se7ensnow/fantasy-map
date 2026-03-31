import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { register } from "../api/auth";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async ({ username, email, password }) => {
        try {
            setErrorMessage("");
            await register(username, email, password);
            toast.success("Registration successful! Please log in.");
            navigate("/login");
        } catch (err) {
            setErrorMessage(err.message || "Registration failed. Please try again.");
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pb-6 text-text-primary">
            <div className="w-full max-w-md rounded-lg border border-border-default/40 bg-surface-panel/80 p-8 shadow-xl backdrop-blur-sm">
                <h1 className="mb-6 text-center text-4xl font-bold text-text-heading">
                    Register
                </h1>

                <AuthForm
                    onSubmit={handleSubmit}
                    showEmail={true}
                    submitLabel="Register"
                    errorMessage={errorMessage}
                />

                <div className="mt-6 text-center">
                    <p className="text-sm text-text-muted">
                        Already have an account?
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-2 text-sm font-semibold text-text-link transition-colors duration-200 hover:text-text-link-hover hover:underline"
                    >
                        Log in
                    </button>
                </div>
            </div>
        </div>
    );
}