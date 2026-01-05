import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { authAPI } from "@/lib/api";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";

export default function AdminLogin() {
    const { setRequires2FA, verify2FA, loginUser } = useStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'login' | '2fa'>('login');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await authAPI.login({ email, password });

            // Check for 2FA requirement
            if (response.data.requires2FA) {
                setRequires2FA(true, response.data.tempToken);
                setStep('2fa');
                setLoading(false);
                return;
            }

            const { token, user } = response.data;

            // Check if user is admin
            if (user.role !== 'admin') {
                setError("You don't have admin access.");
                setLoading(false);
                return;
            }

            // Use store action to update global state immediately
            loginUser(user, token);

            const isDemoAdmin = user.email === 'demo-admin@academypro.com';
            navigate(isDemoAdmin ? "/demo/dashboard" : "/admin/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Invalid email or password.");
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const success = await verify2FA(otp);
        if (success) {
            navigate("/admin/dashboard"); // Only real admins have 2FA, so always go to real dashboard
        } else {
            setError("Invalid OTP code. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center flex justify-center items-center gap-2">
                        {step === 'login' ? <Lock className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6 text-green-600" />}
                        {step === 'login' ? "Admin Login" : "Security Verification"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 'login'
                            ? "Enter your credentials to access the admin panel"
                            : "Enter the code from your Authenticator App"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@lms.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify2FA} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="otp">Authentication Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    autoFocus
                                    className="text-center text-2xl tracking-widest"
                                    disabled={loading}
                                    maxLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Login"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-xs text-muted-foreground"
                                onClick={() => setStep('login')}
                            >
                                Back to Login
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Restricted access. Authorized personnel only.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
