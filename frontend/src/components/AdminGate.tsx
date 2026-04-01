// ============================================================
// ADMIN GATE — PRE-AUTHENTICATION LAYER
// Before reaching the admin login page, the user must:
// 1. Enter their Organization ID
// 2. Enter the portal passphrase set by the Super Admin for that org
//
// Passphrase is verified against the backend (not hardcoded).
// Wrong passphrase = access denied with lockout after 5 attempts.
// ============================================================

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

interface AdminGateProps {
    children: React.ReactNode;
    onOrgVerified?: (orgId: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SESSION_KEY = 'admin_gate_verified_org';

export default function AdminGate({ children, onOrgVerified }: AdminGateProps) {
    const [verified, setVerified] = useState(false);
    const [orgId, setOrgId] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [step, setStep] = useState<'org' | 'passphrase'>('org');
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    // Check if already verified in this session
    useEffect(() => {
        const sessionOrg = sessionStorage.getItem(SESSION_KEY);
        if (sessionOrg) {
            setVerified(true);
            onOrgVerified?.(sessionOrg);
        }
    }, []);

    // Countdown timer for lockout
    useEffect(() => {
        if (!lockedUntil) return;
        const interval = setInterval(() => {
            const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                setLockedUntil(null);
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    // Step 1: Check if org exists and requires passphrase
    const handleOrgSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/organizations/passphrase-check`, {
                params: { orgId: orgId.toUpperCase() }
            });
            if (res.data.success) {
                setOrgName(res.data.orgName);
                setStep('passphrase');
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('Organization not found. Check your Organization ID.');
            } else {
                setError('Unable to verify organization. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify passphrase against backend
    const handlePassphraseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/organizations/verify-passphrase`, {
                orgId: orgId.toUpperCase(),
                passphrase
            });
            if (res.data.valid) {
                // Store verified org in session
                sessionStorage.setItem(SESSION_KEY, orgId.toUpperCase());
                onOrgVerified?.(orgId.toUpperCase());
                setVerified(true);
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                const msg = err.response.data.message || 'Too many attempts.';
                setError(msg);
                // Extract minutes from message if possible
                const match = msg.match(/(\d+) minutes/);
                if (match) {
                    setLockedUntil(Date.now() + parseInt(match[1]) * 60 * 1000);
                }
            } else {
                setError('Incorrect passphrase. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Already verified — show the actual admin login
    if (verified) return <>{children}</>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-sm">

                {/* Header */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {step === 'org' ? <Building2 className="w-8 h-8 text-slate-400" /> : <Shield className="w-8 h-8 text-slate-400" />}
                    </div>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-xl">
                            {step === 'org' ? 'Enter Organization ID' : `Welcome, ${orgName}`}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {step === 'org' ? 'Enter your organization ID to continue' : 'Enter the portal passphrase to access login'}
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {/* Lockout */}
                {lockedUntil && (
                    <div className="p-4 mb-4 text-center bg-slate-800 rounded-lg border border-slate-700">
                        <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
                        <p className="text-red-400 text-sm font-medium">Access Locked</p>
                        <p className="text-slate-500 text-xs mt-1">
                            Try again in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </p>
                    </div>
                )}

                {/* Step 1: Organization ID */}
                {step === 'org' && !lockedUntil && (
                    <form onSubmit={handleOrgSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs uppercase tracking-widest">Organization ID</Label>
                            <Input
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value.toUpperCase())}
                                placeholder="ORG-001"
                                autoFocus required
                                className="bg-slate-800 border-slate-700 text-white font-mono"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Checking...' : 'Continue'}
                        </Button>
                    </form>
                )}

                {/* Step 2: Passphrase */}
                {step === 'passphrase' && !lockedUntil && (
                    <form onSubmit={handlePassphraseSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs uppercase tracking-widest">Portal Passphrase</Label>
                            <div className="relative">
                                <Input
                                    type={showPass ? 'text' : 'password'}
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Enter passphrase"
                                    autoFocus required
                                    className="bg-slate-800 border-slate-700 text-white pr-10"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Access'}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full text-slate-500 text-xs"
                            onClick={() => { setStep('org'); setError(''); setPassphrase(''); }}>
                            ← Change Organization ID
                        </Button>
                    </form>
                )}

                <p className="text-center text-slate-700 text-xs mt-6">
                    Unauthorized access attempts are logged.
                </p>
            </div>
        </div>
    );
}
