// ============================================================
// ADMIN LOGIN PAGE
// Supports two login methods:
//   1. Email + Password (then 2FA OTP if enabled)
//   2. Email + 2FA OTP directly (if 2FA is enabled — skips password)
//
// Role display names:
//   org_superadmin → "Organization Admin" (top admin of an org)
//   admin          → "Staff Admin" (admin under an org)
//   superadmin     → "Platform Admin" (platform owner)
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { authAPI } from "@/lib/api";
import { Eye, EyeOff, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { useStore } from "@/lib/store";

export default function AdminLogin({ orgId: propOrgId = '' }: { orgId?: string }) {
    const { setRequires2FA, verify2FA, loginUser } = useStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [orgId, setOrgId] = useState<string>(propOrgId);
    const navigate = useNavigate();

    // Login mode: 'password' = email+password, '2fa-direct' = email+OTP only, 'otp-verify' = OTP after password
    const [loginMode, setLoginMode] = useState<'password' | '2fa-direct' | 'otp-verify'>('password');

    useEffect(() => {
        if (propOrgId) setOrgId(propOrgId);
    }, [propOrgId]);

    // Mode 1: Email + Password login
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await authAPI.adminLogin({ email, password, organizationId: orgId || undefined });

            if (response.data.requires2FA) {
                // Password correct, now need OTP
                setRequires2FA(true, response.data.tempToken);
                setLoginMode('otp-verify');
                setLoading(false);
                return;
            }

            const { token, user } = response.data;
            await loginUser(user, token);
            const isDemoAdmin = user.email === 'demo-admin@academypro.com';
            setTimeout(() => navigate(isDemoAdmin ? "/demo/dashboard" : "/admin/dashboard"), 100);
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid email or password.");
            setLoading(false);
        }
    };

    // Mode 2: Email + 2FA OTP directly (no password needed if 2FA is enabled)
    const handleDirectOTPLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // First verify the user exists and has 2FA enabled
            const response = await authAPI.adminLogin({
                email,
                password: '__2FA_DIRECT__', // signal to backend
                organizationId: orgId || undefined,
                use2FA: true
            });

            if (response.data.requires2FA) {
                setRequires2FA(true, response.data.tempToken);
                setLoginMode('otp-verify');
                setLoading(false);
            } else {
                setError("2FA is not enabled on this account. Use email + password instead.");
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Account not found or 2FA not enabled.");
            setLoading(false);
        }
    };

    // OTP verification (after either login mode)
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const success = await verify2FA(otp);
        if (success) {
            navigate("/admin/dashboard");
        } else {
            setError("Invalid OTP code. Please try again.");
            setLoading(false);
        }
    };

    const orgLabel = orgId ? `Organization: ${orgId}` : null;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center flex justify-center items-center gap-2">
                        {loginMode === 'otp-verify'
                            ? <><ShieldCheck className="w-6 h-6 text-green-600" /> 2FA Verification</>
                            : loginMode === '2fa-direct'
                            ? <><Smartphone className="w-6 h-6 text-primary" /> Login with 2FA</>
                            : <><Lock className="w-6 h-6" /> Admin Login</>
                        }
                    </CardTitle>
                    {orgLabel && (
                        <div className="text-center">
                            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-mono font-bold">
                                {orgLabel}
                            </span>
                        </div>
                    )}
                    <CardDescription className="text-center text-xs">
                        {loginMode === 'otp-verify'
                            ? "Enter the 6-digit code from your authenticator app"
                            : loginMode === '2fa-direct'
                            ? "Enter your email — we'll send you to the OTP step"
                            : "Enter your credentials to access the admin panel"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="p-3 mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Mode: Email + Password */}
                    {loginMode === 'password' && (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="admin@org.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    required disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input id="password" type={showPassword ? "text" : "password"}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        required disabled={loading} className="pr-10" />
                                    <Button type="button" variant="ghost" size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">or</span>
                                </div>
                            </div>
                            <Button type="button" variant="outline" className="w-full gap-2"
                                onClick={() => { setLoginMode('2fa-direct'); setError(''); }}>
                                <Smartphone className="h-4 w-4" /> Login with 2FA instead
                            </Button>
                        </form>
                    )}

                    {/* Mode: 2FA Direct (email only, then OTP) */}
                    {loginMode === '2fa-direct' && (
                        <form onSubmit={handleDirectOTPLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email2fa">Email</Label>
                                <Input id="email2fa" type="email" placeholder="admin@org.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    required disabled={loading} autoFocus />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your account must have 2FA enabled. You'll be asked for your authenticator code next.
                            </p>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Checking..." : "Continue with 2FA"}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full text-xs text-muted-foreground"
                                onClick={() => { setLoginMode('password'); setError(''); }}>
                                ← Back to email + password
                            </Button>
                        </form>
                    )}

                    {/* Mode: OTP Verification */}
                    {loginMode === 'otp-verify' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Authenticator Code</Label>
                                <Input id="otp" type="text" inputMode="numeric" pattern="[0-9]*"
                                    placeholder="000000" value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required autoFocus maxLength={6}
                                    className="text-center text-2xl tracking-widest" disabled={loading} />
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Login"}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full text-xs text-muted-foreground"
                                onClick={() => { setLoginMode('password'); setRequires2FA(false, null); setError(''); setOtp(''); }}>
                                ← Back to Login
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">Restricted access. Authorized personnel only.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
