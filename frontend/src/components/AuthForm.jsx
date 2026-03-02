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
        <form
            onSubmit={handleSubmit}
            className="
        space-y-4
        max-w-md
        mx-auto
        p-6
        rounded-lg
        shadow
        bg-surface-panel/90
        border border-border-default/40
      "
        >
            <div>
                <Label className="block mb-1 font-semibold">
                    Username
                </Label>
                <Input
                    className="!text-text-heading"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>

            {showEmail && (
                <div>
                    <Label className="block mb-1 font-semibold">
                        Email
                    </Label>
                    <Input
                        className="!text-text-heading"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            )}

            <div>
                <Label className="block mb-1 font-semibold">
                    Password
                </Label>
                <Input
                    className="!text-text-heading"
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