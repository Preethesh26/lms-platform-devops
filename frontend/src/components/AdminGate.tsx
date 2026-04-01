// ============================================================
// ADMIN GATE — PRE-AUTHENTICATION LAYER
// Before reaching the admin login page, the user must enter
// a portal passphrase. Wrong passphrase = access denied.
//
// This adds a second layer of security on top of the login.
// Even if someone finds /admin/login, they still need the
// portal passphrase to see the actual login form.
//
// Set VITE_ADMIN_PASSPHRASE in frontend/.env
// ============================================================

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminGateProps {
    children: React.ReactNode;
}

// Passphrase set in frontend/.env as VITE_ADMIN_PASSPHRASE
const PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE || 'academypro2026';
const SESSION_KEY = 'admin_gate_verified';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export default function AdminGate({ children }: AdminGateProps) {
    const [verified, setVerified] = useState(false);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    // Check if already verified in this session
    useEffect(() => {
        const sessionVerified = sessionStorage.getItem(SESSION_KEY);
        if (sessionVerified === 'true') {
            setVerified(true);
        }

        // Check for existing lockout
        const lockout = localStorage.getItem('admin_gate_lockout');
        if (lockout) {
            const lockoutTime = parseInt(lockout);
            if (Date.now() < lockoutTime) {
                setLockedUntil(lockoutTime);
            } else {
                localStorage.removeItem('admin_gate_lockout');
                localStorage.removeItem('admin_gate_attempts');
            }
        }

        // Restore attempt count
        const savedAttempts = localStorage.getItem('admin_gate_attempts');
        if (savedAttempts) setAttempts(parseInt(savedAttempts));
    }, []);

    // Countdown timer for lockout
    useEffect(() => {
        if (!lockedUntil) return;
        const interval = setInterval(() => {
            const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                setLockedUntil(null);
                setAttempts(0);
                localStorage.removeItem('admin_gate_lockout');
                localStorage.removeItem('admin_gate_attempts');
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (lockedUntil) return;

        if (input === PASSPHRASE) {
            // Correct — grant access for this browser session
            sessionStorage.setItem(SESSION_KEY, 'true');
            localStorage.removeItem('admin_gate_attempts');
            localStorage.removeItem('admin_gate_lockout');
            setVerified(true);
        } else {
            // Wrong passphrase
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            localStorage.setItem('admin_gate_attempts', newAttempts.toString());

            if (newAttempts >= MAX_ATTEMPTS) {
                // Lock out for 15 minutes
                const lockoutTime = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
                setLockedUntil(lockoutTime);
                localStorage.setItem('admin_gate_lockout', lockoutTime.toString());
                setError(`Too many failed attempts. Locked for ${LOCKOUT_MINUTES} minutes.`);
            } else {
                setError(`Incorrect passphrase. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
            }
            setInput('');
        }
    };

    // Already verified — show the actual admin login
    if (verified) return <>{children}</>;

    // Pre-auth gate screen
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-sm">

                {/* Header */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-xl">Restricted Access</h1>
                        <p className="text-slate-500 text-sm mt-1">Enter the portal passphrase to continue</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    {lockedUntil ? (
                        <div className="p-4 text-center bg-slate-800 rounded-lg border border-slate-700">
                            <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-red-400 text-sm font-medium">Access Locked</p>
                            <p className="text-slate-500 text-xs mt-1">
                                Try again in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="passphrase" className="text-slate-400 text-xs uppercase tracking-widest">
                                    Portal Passphrase
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="passphrase"
                                        type={showPass ? 'text' : 'password'}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Enter passphrase"
                                        autoFocus
                                        required
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                                Verify Access
                            </Button>
                        </>
                    )}
                </form>

                <p className="text-center text-slate-700 text-xs mt-6">
                    Unauthorized access attempts are logged.
                </p>
            </div>
        </div>
    );
}
