import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { authAPI, settingsAPI } from "@/lib/api";
import { TakeTestDialog } from "@/components/user/TakeTestDialog";
import { Keyboard, Eye, EyeOff } from "lucide-react";

export default function UserLogin() {
    const [email, setEmail] = useState("");
    const [enrollment, setEnrollment] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [showTakeTest, setShowTakeTest] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { loginUser } = useStore();

    useEffect(() => {
        const checkSettings = async () => {
            try {
                const res = await settingsAPI.getAll();
                setShowTakeTest(res.data.data.showTakeTestButton);
            } catch (error) {
                console.error('Failed to fetch settings');
            }
        };
        checkSettings();
    }, []);

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
            } else if (user.role === 'admin') {
                navigate("/admin/dashboard");
            } else {
                navigate("/welcome");
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
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-6 relative overflow-hidden">
            {/* Soft background accents */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-50 blur-[120px]"></div>
            </div>

            <Card className="w-full max-w-md relative bg-white border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden">
                {showTakeTest && (
                    <div className="absolute top-6 right-6">
                        <TakeTestDialog>
                            <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-slate-50 text-slate-600">
                                <Keyboard className="h-3.5 w-3.5 mr-2" />
                                Take Test
                            </Button>
                        </TakeTestDialog>
                    </div>
                )}
                <CardHeader className="space-y-4 pt-10 px-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-slate-600">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Student Login</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Welcome back! Sign in to continue your journey.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl font-bold text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="enrollment" className="text-xs font-bold uppercase tracking-widest px-1 opacity-70">Enrollment Number</Label>
                            <Input
                                id="enrollment"
                                type="text"
                                placeholder="E2024-001"
                                className="h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-primary focus-visible:ring-offset-0 px-4 font-medium"
                                value={enrollment}
                                onChange={(e) => setEnrollment(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest px-1 opacity-70">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-primary focus-visible:ring-offset-0 px-4 font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest opacity-70">Password</Label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-[10px] font-bold text-primary uppercase tracking-wider hover:opacity-70 transition-opacity"
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-primary focus-visible:ring-offset-0 px-4 pr-10 font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 font-bold rounded-xl shadow-xl shadow-primary/20 bg-primary text-white hover:scale-[1.02] active:scale-95 transition-all mt-4" disabled={loading}>
                            {loading ? "Authenticating..." : "Sign In to Portal"}
                        </Button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50"></span></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white px-4 text-muted-foreground">New Here?</span></div>
                        </div>

                        <Link to="/signup" className="block">
                            <Button variant="outline" type="button" className="w-full h-12 font-bold rounded-xl border-border/50 hover:bg-muted/30 transition-all">
                                Create Student Account
                            </Button>
                        </Link>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-8 border-t border-border/30 pt-6">
                    <p className="text-xs font-medium text-muted-foreground">
                        Need assistance? <Link to="/contact-admin" className="text-primary font-bold hover:underline">Contact Admin</Link>
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
                            {forgotEmail && (
                                <div className={`p-3 text-sm rounded-md font-bold text-center ${forgotEmail.includes('@')
                                    ? 'text-white bg-green-600'
                                    : 'text-white bg-red-600'
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
