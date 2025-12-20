import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { supportAPI } from "@/lib/api";

export default function ContactAdmin() {
    const { currentUser } = useStore();
    const [name, setName] = useState(currentUser?.email?.split('@')[0] || "");
    const [email, setEmail] = useState(currentUser?.email || "");
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await supportAPI.contactAdmin({ name, email, message });
            setSuccessMessage(response.data.message);
            setMessage("");
            setTimeout(() => {
                navigate("/");
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Error sending message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Contact Admin</CardTitle>
                    <CardDescription className="text-center">
                        Having trouble? Send a message to the admin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {successMessage && (
                            <div className="p-3 text-sm text-white bg-green-600 rounded-md font-bold text-center">
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="p-3 text-sm text-white bg-red-600 border-2 border-red-800 rounded-md font-bold text-center italic">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Your Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <textarea
                                id="message"
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Describe your issue or question..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1 font-bold rounded-lg" onClick={() => navigate("/")}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 font-black rounded-lg shadow-xl" disabled={loading}>
                                {loading ? "Sending..." : "Send Message"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
