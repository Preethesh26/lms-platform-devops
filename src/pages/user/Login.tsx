import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { authAPI } from "@/lib/api";

export default function UserLogin() {
    const [email, setEmail] = useState("");
    const [enrollment, setEnrollment] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { loginUser } = useStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;

            // Verify enrollment number matches (for students only)
            if (user.role === 'user' && user.enrollment !== enrollment) {
                setError("Invalid enrollment number");
                setLoading(false);
                return;
            }

            loginUser(user, token);

            // Check for redirect parameter
            const redirectTo = searchParams.get('redirect');
            if (redirectTo) {
                navigate(redirectTo);
            } else {
                navigate("/");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotMessage("");
        setForgotLoading(true);

        try {
            const response = await authAPI.forgotPassword({ email: forgotEmail });
            setForgotMessage(response.data.message);
            setForgotEmail("");
        } catch (err: any) {
            setForgotMessage(err.response?.data?.message || "Error sending reset email");
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Student Login</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your courses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="enrollment">Enrollment Number</Label>
                            <Input
                                id="enrollment"
                                type="text"
                                placeholder="Enter your enrollment number"
                                value={enrollment}
                                onChange={(e) => setEnrollment(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Sign Up
                            </Link>
                        </p>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Need help? <Link to="/contact-admin" className="text-primary hover:underline">Contact Admin</Link>
                    </p>
                </CardFooter>
            </Card>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Forgot Password</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword}>
                        <div className="space-y-4 py-4">
                            {forgotMessage && (
                                <div className={`p-3 text-sm rounded-md ${forgotMessage.includes('sent')
                                    ? 'text-green-600 bg-green-50 dark:bg-green-950/20'
                                    : 'text-red-500 bg-red-500/10'
                                    }`}>
                                    {forgotMessage}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="forgot-email">Email</Label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                    disabled={forgotLoading}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={forgotLoading}>
                                {forgotLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
