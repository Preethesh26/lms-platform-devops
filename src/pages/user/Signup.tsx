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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6">
                <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="text-center space-y-4 pt-10 px-8">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome Aboard!</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Your learning journey begins now.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-8 rounded-2xl border border-indigo-100 text-center">
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-3">Your Unique Enrollment Number</p>
                            <p className="text-4xl font-mono font-extrabold text-primary tracking-wider">{enrollmentNumber}</p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs text-center text-muted-foreground font-medium italic">
                                Please save this number carefully. You'll need it for future logins.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-.3s]"></span>
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-.5s]"></span>
                                <span className="text-xs font-bold uppercase tracking-widest ml-1">Entering Portal...</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6">
            {/* Decorative Background Circles */}
            <div className="fixed -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"></div>

            <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="space-y-4 pt-10 px-8 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Create Account</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Join thousands of students on their path to mastery.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest px-1 opacity-70">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                className="h-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary px-4 font-medium"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest px-1 opacity-70">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                className="h-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary px-4 font-medium"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest px-1 opacity-70">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary px-4 font-medium text-sm"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest px-1 opacity-70">Confirm</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary px-4 font-medium text-sm"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl font-bold text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 font-bold rounded-xl shadow-xl shadow-primary/20 bg-primary text-white hover:scale-[1.02] active:scale-95 transition-all mt-4"
                            disabled={loading}
                        >
                            {loading ? "Creating your account..." : "Complete Registration"}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground font-medium">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
