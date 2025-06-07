import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AuthForm({ onSubmit, showEmail = false, submitLabel = "Submit" }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { username, password };
        if (showEmail) {
            data.email = email;
        }
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white/80 rounded shadow border border-amber-700">
            <div>
                <Label className="block mb-1 font-semibold text-amber-900">Username</Label>
                <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>

            {showEmail && (
                <div>
                    <Label className="block mb-1 font-semibold text-amber-900">Email</Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            )}

            <div>
                <Label className="block mb-1 font-semibold text-amber-900">Password</Label>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <Button type="submit" className="w-full">
                {submitLabel}
            </Button>
        </form>
    );
}