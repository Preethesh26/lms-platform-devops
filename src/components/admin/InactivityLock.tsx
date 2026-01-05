import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function InactivityLock() {
    const { isLocked, unlockSession } = useStore();
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isLocked) return null;

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await unlockSession(otp);
            setOtp(""); // Clear OTP on success (state will unlock)
        } catch (err) {
            setError("Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-2xl border-2 border-red-500/20 animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400">
                        Session Locked
                    </CardTitle>
                    <CardDescription>
                        Your session has been locked due to inactivity (10m). Please enter your 2FA code to resume.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        {error && (
                            <div className="text-xs text-red-500 text-center font-medium bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <div className="relative">
                                <ShieldAlert className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="Enter 6-digit Code"
                                    className="pl-10 text-center font-mono text-lg tracking-widest"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            disabled={loading}
                        >
                            {loading ? "Unlocking..." : "Unlock Session"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
