// ============================================================
// SUPER ADMIN — SECURITY SETTINGS
// Enable/disable 2FA for the super admin account
// Uses the existing /api/auth/2fa/* endpoints
// ============================================================

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, QrCode, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

// Use the superadmin token for these requests
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(config => {
    const token = localStorage.getItem('superadmin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default function SuperAdminSecurity() {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Get current user 2FA status
        api.get('/auth/me')
            .then(res => setTwoFactorEnabled(res.data.data?.twoFactorEnabled || false))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSetup = async () => {
        setError('');
        try {
            const res = await api.post('/auth/2fa/setup');
            setQrCode(res.data.qrCode);
            setSecret(res.data.secret);
            setStep('setup');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to setup 2FA');
        }
    };

    const handleEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/2fa/enable', { token: otp });
            setTwoFactorEnabled(true);
            setStep('idle');
            setOtp('');
            setSuccess('2FA enabled successfully. It will be required on your next login.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP code');
        }
    };

    const handleDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/2fa/disable', { password });
            setTwoFactorEnabled(false);
            setStep('idle');
            setPassword('');
            setSuccess('2FA disabled successfully.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Incorrect password');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
    );

    return (
        <div className="max-w-lg space-y-6">
            <div>
                <h1 className="text-white text-2xl font-bold">Security Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage two-factor authentication for your super admin account</p>
            </div>

            {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
            {success && <div className="p-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">{success}</div>}

            {/* 2FA Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${twoFactorEnabled ? 'bg-green-500/10' : 'bg-slate-800'}`}>
                            {twoFactorEnabled
                                ? <ShieldCheck className="w-6 h-6 text-green-400" />
                                : <ShieldOff className="w-6 h-6 text-slate-500" />
                            }
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Two-Factor Authentication</h3>
                            <p className={`text-sm font-medium ${twoFactorEnabled ? 'text-green-400' : 'text-slate-500'}`}>
                                {twoFactorEnabled ? 'Enabled — required on login' : 'Disabled — not required on login'}
                            </p>
                        </div>
                    </div>
                    {step === 'idle' && (
                        twoFactorEnabled
                            ? <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => setStep('disable')}>
                                Disable
                            </Button>
                            : <Button size="sm" onClick={handleSetup} className="gap-1">
                                <Shield className="w-4 h-4" /> Enable 2FA
                            </Button>
                    )}
                </div>
            </div>

            {/* Setup: Show QR code */}
            {step === 'setup' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" /> Scan QR Code
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Scan this QR code with Google Authenticator, Authy, or any TOTP app.
                        </p>
                    </div>

                    {qrCode && (
                        <div className="flex justify-center">
                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl bg-white p-2" />
                        </div>
                    )}

                    <div className="bg-slate-800 rounded-lg p-3">
                        <p className="text-slate-500 text-xs mb-1">Manual entry key:</p>
                        <p className="text-white font-mono text-sm break-all">{secret}</p>
                    </div>

                    <form onSubmit={handleEnable} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs uppercase tracking-widest">
                                Enter the 6-digit code to confirm
                            </Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="000000"
                                autoFocus required
                                className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest font-mono"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" className="flex-1 text-slate-400"
                                onClick={() => { setStep('idle'); setOtp(''); setQrCode(''); setSecret(''); }}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">Verify & Enable</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Disable: Confirm with password */}
            {step === 'disable' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Key className="w-5 h-5 text-red-400" /> Disable 2FA
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Enter your password to confirm disabling 2FA.</p>
                    </div>
                    <form onSubmit={handleDisable} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Password</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                required autoFocus
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" className="flex-1 text-slate-400"
                                onClick={() => { setStep('idle'); setPassword(''); }}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">Disable 2FA</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Info box */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 text-xs leading-relaxed">
                    When 2FA is enabled, you will be required to enter a 6-digit code from your authenticator app
                    as Step 4 of the super admin login flow. This adds an extra layer of security beyond the
                    secret key, passphrase, and password.
                </p>
            </div>
        </div>
    );
}
