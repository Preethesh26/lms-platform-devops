// ============================================================
// SUPER ADMIN LOGIN — TRIPLE-STEP AUTHENTICATION
// Step 1: Secret key
// Step 2: Portal passphrase
// Step 3: Email + password
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { step1, step2, step3 } from '@/lib/superAdminApi';

type Step = 1 | 2 | 3;

export default function SuperAdminLogin() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [stepToken, setStepToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // Form values
    const [secretKey, setSecretKey] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await step1(secretKey);
            setStepToken(res.data.stepToken);
            setCurrentStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid secret key');
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await step2(stepToken, passphrase);
            setStepToken(res.data.stepToken);
            setCurrentStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid passphrase');
        } finally {
            setLoading(false);
        }
    };

    const handleStep3 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await step3(stepToken, email, password);
            // Store super admin token separately from org admin token
            localStorage.setItem('superadmin_token', res.data.token);
            localStorage.setItem('superadmin_user', JSON.stringify(res.data.user));
            navigate('/superadmin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const stepIcons = [Key, Shield, Lock];
    const stepLabels = ['Secret Key', 'Portal Passphrase', 'Credentials'];
    const StepIcon = stepIcons[currentStep - 1];

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-sm">

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                s < currentStep ? 'bg-green-600 text-white' :
                                s === currentStep ? 'bg-primary text-white' :
                                'bg-slate-800 text-slate-500'
                            }`}>
                                {s < currentStep ? '✓' : s}
                            </div>
                            {s < 3 && <div className={`w-8 h-0.5 ${s < currentStep ? 'bg-green-600' : 'bg-slate-800'}`} />}
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="flex flex-col items-center mb-6 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <StepIcon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-xl">Super Admin Access</h1>
                        <p className="text-slate-500 text-sm mt-1">Step {currentStep}: {stepLabels[currentStep - 1]}</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {/* Step 1: Secret Key */}
                {currentStep === 1 && (
                    <form onSubmit={handleStep1} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs uppercase tracking-widest">Secret Key</Label>
                            <div className="relative">
                                <Input
                                    type={showPass ? 'text' : 'password'}
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    placeholder="Enter secret key"
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
                            {loading ? 'Verifying...' : 'Continue'}
                        </Button>
                    </form>
                )}

                {/* Step 2: Passphrase */}
                {currentStep === 2 && (
                    <form onSubmit={handleStep2} className="space-y-4">
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
                            {loading ? 'Verifying...' : 'Continue'}
                        </Button>
                    </form>
                )}

                {/* Step 3: Email + Password */}
                {currentStep === 3 && (
                    <form onSubmit={handleStep3} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs uppercase tracking-widest">Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="superadmin@email.com"
                                autoFocus required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs uppercase tracking-widest">Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                    className="bg-slate-800 border-slate-700 text-white pr-10"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                )}

                <p className="text-center text-slate-700 text-xs mt-6">
                    Unauthorized access attempts are logged and monitored.
                </p>
            </div>
        </div>
    );
}
