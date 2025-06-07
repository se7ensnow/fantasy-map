import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function MapForm({ initialTitle = "", initialDescription = "", onSubmit, loading }) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [error, setError] = useState("");

    useEffect(() => {
        setTitle(initialTitle);
        setDescription(initialDescription);
    }, [initialTitle, initialDescription]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        setError("");
        onSubmit(title, description);
    };

    return (
        <Card className="bg-[rgba(252,247,233,0.9)] border-amber-700 mb-6">
            <CardHeader>
                <CardTitle className="text-xl">
                    {initialTitle ? "Edit Map Info" : "Create New Map"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium text-amber-900">Title:</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-amber-900">Description:</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Map"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}