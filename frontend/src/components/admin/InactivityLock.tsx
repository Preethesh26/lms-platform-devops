import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldAlert, KeyRound, ChevronRight, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function InactivityLock() {
    const { isLocked, unlockSession, masterUnlock, logoutUser } = useStore();
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [isMasterMode, setIsMasterMode] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isLocked) return null;

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let success = false;
            if (isMasterMode) {
                success = await masterUnlock(email, otp);
            } else {
                success = await unlockSession(otp);
            }

            if (success) {
                setOtp("");
                setEmail("");
                setIsMasterMode(false);
            } else {
                setError("Verification failed. Please check your credentials.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during verification.");
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
                <CardContent className="space-y-4">
                    <form onSubmit={handleUnlock} className="space-y-4">
                        {error && (
                            <div className="text-[10px] text-red-500 text-center font-bold uppercase tracking-widest bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {isMasterMode && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] uppercase tracking-widest font-black opacity-60">Master Email</Label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <Input
                                            type="email"
                                            placeholder="superadmin@academypro.com"
                                            className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-800"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-black opacity-60">
                                    {isMasterMode ? 'Master 2FA Code' : 'Your 2FA Code'}
                                </Label>
                                <div className="relative">
                                    <ShieldAlert className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="000000"
                                        className="pl-10 text-center font-mono text-lg tracking-[0.5em] h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-red-500"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                    Verifying...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {isMasterMode ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    {isMasterMode ? "Master Unlock" : "Unlock Session"}
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="pt-2 flex flex-col gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 hover:text-red-500 hover:bg-red-50/5 h-8 rounded-lg group"
                            onClick={() => {
                                setIsMasterMode(!isMasterMode);
                                setError("");
                            }}
                        >
                            {isMasterMode ? "Back to standard unlock" : "Need Super Admin unlock?"}
                            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-8 rounded-lg"
                            onClick={() => {
                                logoutUser();
                                window.location.href = "/admin/login";
                            }}
                        >
                            Log Out / Back to Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
