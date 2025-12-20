import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
    const navigate = useNavigate();
    const { loginUser } = useStore();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [enrollmentNumber, setEnrollmentNumber] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            // Show success message with enrollment number
            setEnrollmentNumber(data.user.enrollment);
            setShowSuccess(true);

            // Auto-login after 3 seconds
            setTimeout(() => {
                loginUser(data.user, data.token);
                navigate("/welcome");
            }, 3000);

        } catch (err: any) {
            setError(err.message || "An error occurred during registration");
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary p-4">
                <Card className="w-full max-w-md border-4 border-white shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <CardTitle className="text-3xl font-black">Registration Successful!</CardTitle>
                        <CardDescription className="font-bold">
                            Your account has been created successfully.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-6 rounded-xl border-2 border-primary shadow-inner">
                            <p className="text-sm text-foreground font-black mb-2 uppercase tracking-widest">Your Enrollment Number:</p>
                            <p className="text-3xl font-mono font-black text-primary">{enrollmentNumber}</p>
                        </div>
                        <p className="text-sm text-center text-foreground font-bold">
                            Please save this enrollment number properly.
                        </p>
                        <p className="text-sm text-center text-primary font-black animate-pulse">
                            Redirecting to learning portal...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4">
            <Card className="w-full max-w-md border-4 border-white shadow-2xl">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-3xl font-black text-center">Create Account</CardTitle>
                    <CardDescription className="text-center font-bold">
                        Join our learning platform and start your journey
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="At least 6 characters"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Re-enter your password"
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-600 text-white p-3 rounded-md text-sm font-black text-center shadow-lg italic">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full font-black text-lg py-6 rounded-xl shadow-xl hover:scale-[1.02] transition-transform"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Log In
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
