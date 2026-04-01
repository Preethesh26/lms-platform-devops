import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2, Save, ShieldCheck, Lock, CheckCircle2, Construction, Megaphone } from 'lucide-react';
import { settingsAPI } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
    const { currentUser, setup2FA, enable2FA, disable2FA } = useStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        showTakeTestButton: false,
        maintenanceMode: false,
        maintenanceMessage: 'We are currently updating the platform. Please check back soon.',
        announcementEnabled: false,
        announcementText: '',
        announcementType: 'info'
    });

    // 2FA Setup State
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
    const [isDisabling2FA, setIsDisabling2FA] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");

    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await settingsAPI.getAll();
            setSettings(prev => ({ ...prev, ...res.data.data }));
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        setLoading(true);
        try {
            const success = await disable2FA(confirmPassword);
            if (success) {
                setIsDisabling2FA(false);
                setConfirmPassword("");
                alert("2FA Disabled Successfully");
            } else {
                alert("Incorrect Password");
            }
        } catch (error) {
            alert("Failed to disable 2FA");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsAPI.update(settings);
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const start2FASetup = async () => {
        try {
            const data = await setup2FA();
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setIsSettingUp2FA(true);
        } catch (error) {
            alert("Failed to start 2FA setup");
        }
    };

    const handleVerifyAndEnable = async () => {
        setVerifying(true);
        try {
            const success = await enable2FA(otp);
            if (success) {
                setIsSettingUp2FA(false);
                setQrCode("");
                setSecret("");
                setOtp("");
                alert("2FA Enabled Successfully!");
            } else {
                alert("Invalid Code");
            }
        } catch (error) {
            alert("Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage global application configurations</p>
            </div>

            <div className="grid gap-6">
                {/* Public Features Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Public Features</CardTitle>
                        <CardDescription>Control visibility of public-facing features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label htmlFor="showTakeTestButton" className="text-base font-medium">
                                    Show "Take Test" Button
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable a "Take Test" button on the home page and login page.
                                    This allows users to access tests by entering a test code.
                                </p>
                            </div>
                            <Switch
                                id="showTakeTestButton"
                                checked={settings.showTakeTestButton}
                                onCheckedChange={(checked: boolean) => setSettings({ ...settings, showTakeTestButton: checked })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSave} disabled={saving} className="ml-auto flex items-center gap-2">
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Access Control Card */}
                <Card className="border-amber-500/20 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Construction className="h-5 w-5 text-amber-600" />
                            <CardTitle>Access Control</CardTitle>
                        </div>
                        <CardDescription>Manage platform accessibility and maintenance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label htmlFor="maintenanceMode" className="text-base font-medium">
                                    Maintenance Mode
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Lock the platform for all users except admins. Displays a maintenance page with a custom message.
                                </p>
                            </div>
                            <Switch
                                id="maintenanceMode"
                                checked={settings.maintenanceMode}
                                onCheckedChange={(checked: boolean) => setSettings({ ...settings, maintenanceMode: checked })}
                            />
                        </div>

                        {settings.maintenanceMode && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 pl-4 border-l-2 border-amber-200">
                                <Label htmlFor="maintenanceMessage" className="text-sm font-medium">
                                    Maintenance Message
                                </Label>
                                <Textarea
                                    id="maintenanceMessage"
                                    value={settings.maintenanceMessage}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                                    placeholder="Enter the message to display during maintenance..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSave} disabled={saving} className="ml-auto flex items-center gap-2">
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Announcement Bar Card */}
                <Card className="border-blue-500/20 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-blue-600" />
                            <CardTitle>Announcement Bar</CardTitle>
                        </div>
                        <CardDescription>Display important messages to all users</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label htmlFor="announcementEnabled" className="text-base font-medium">
                                    Show Announcement
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Display a banner at the top of the page for all users.
                                </p>
                            </div>
                            <Switch
                                id="announcementEnabled"
                                checked={settings.announcementEnabled}
                                onCheckedChange={(checked: boolean) => setSettings({ ...settings, announcementEnabled: checked })}
                            />
                        </div>

                        {settings.announcementEnabled && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pl-4 border-l-2 border-blue-200">
                                <div className="space-y-2">
                                    <Label htmlFor="announcementText" className="text-sm font-medium">
                                        Announcement Text
                                    </Label>
                                    <Input
                                        id="announcementText"
                                        value={settings.announcementText}
                                        onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                                        placeholder="Enter your announcement message..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="announcementType" className="text-sm font-medium">
                                        Banner Type
                                    </Label>
                                    <Select
                                        value={settings.announcementType}
                                        onValueChange={(value) => setSettings({ ...settings, announcementType: value })}
                                    >
                                        <SelectTrigger id="announcementType">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info (Blue)</SelectItem>
                                            <SelectItem value="success">Success (Green)</SelectItem>
                                            <SelectItem value="warning">Warning (Amber)</SelectItem>
                                            <SelectItem value="critical">Critical (Red)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSave} disabled={saving} className="ml-auto flex items-center gap-2">
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Security Card */}
                <Card className="border-orange-500/20 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-orange-600" />
                            <CardTitle>Account Security</CardTitle>
                        </div>
                        <CardDescription>Manage your account protection settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    Two-Factor Authentication (2FA)
                                    {currentUser?.twoFactorEnabled && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Enabled</span>
                                    )}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                                    Secure your account with Google Authenticator. When enabled, you'll need to enter a 6-digit code every time you login or when your session is locked.
                                </p>
                            </div>

                            {!currentUser?.twoFactorEnabled ? (
                                <Button onClick={start2FASetup} variant="outline" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Setup 2FA
                                </Button>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Active & Protected
                                    </div>
                                    <Button
                                        onClick={() => setIsDisabling2FA(true)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        Disable
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Disable 2FA Confirmation */}
                        {isDisabling2FA && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 border-t pt-6">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white p-2 rounded-full border border-red-100">
                                            <ShieldCheck className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-red-900">Disable Security Protection?</h4>
                                            <p className="text-sm text-red-700 mt-1">
                                                This will lower your account security. Please verify your password to continue.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 max-w-sm ml-auto">
                                        <Input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-white"
                                        />
                                        <Button
                                            variant="destructive"
                                            onClick={handleDisable2FA}
                                            disabled={loading || !confirmPassword}
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsDisabling2FA(false);
                                                setConfirmPassword("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isSettingUp2FA && !currentUser?.twoFactorEnabled && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 border-t pt-6">
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div className="flex flex-col items-center p-4 bg-white rounded-xl border shadow-sm">
                                        {qrCode ? (
                                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mb-2" />
                                        ) : (
                                            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                                        )}
                                        <p className="text-xs text-muted-foreground font-mono bg-slate-100 px-2 py-1 rounded">
                                            Secret: {secret}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-lg">Verify Setup</h4>
                                            <p className="text-sm text-muted-foreground">
                                                1. Scan the QR code with your Authenticator App.<br />
                                                2. Enter the 6-digit code below to confirm.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="000 000"
                                                className="text-center text-lg tracking-widest font-mono"
                                                maxLength={6}
                                            />
                                            <Button onClick={handleVerifyAndEnable} disabled={verifying || otp.length !== 6}>
                                                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enable"}
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setIsSettingUp2FA(false)} className="text-muted-foreground">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
