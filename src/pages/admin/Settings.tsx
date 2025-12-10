import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        showTakeTestButton: false
    });

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
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
