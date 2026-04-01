// ============================================================
// SUPER ADMIN DASHBOARD
// Lists all organizations with stats
// Create, activate/deactivate, reset passphrase
// ============================================================

import { useState, useEffect } from 'react';
import { Building2, Plus, ToggleLeft, ToggleRight, Key, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getOrganizations, createOrganization, updateOrganization } from '@/lib/superAdminApi';

interface Org {
    _id: string;
    organizationId: string;
    name: string;
    adminEmail: string;
    isActive: boolean;
    createdAt: string;
    stats: { userCount: number; courseCount: number };
}

export default function SuperAdminDashboard() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPassphraseModal, setShowPassphraseModal] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Create org form
    const [form, setForm] = useState({
        name: '', adminEmail: '', adminPassphrase: '', adminName: '', adminPassword: ''
    });

    // Reset passphrase form
    const [newPassphrase, setNewPassphrase] = useState('');

    const fetchOrgs = async () => {
        try {
            const res = await getOrganizations();
            setOrgs(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrgs(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createOrganization(form);
            setShowCreateModal(false);
            setForm({ name: '', adminEmail: '', adminPassphrase: '', adminName: '', adminPassword: '' });
            fetchOrgs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create organization');
        }
    };

    const handleToggleActive = async (org: Org) => {
        try {
            await updateOrganization(org._id, { isActive: !org.isActive });
            fetchOrgs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update organization');
        }
    };

    const handleResetPassphrase = async (orgId: string) => {
        if (!newPassphrase) return;
        try {
            await updateOrganization(orgId, { adminPassphrase: newPassphrase });
            setShowPassphraseModal(null);
            setNewPassphrase('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset passphrase');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Organizations</h1>
                    <p className="text-slate-500 text-sm mt-1">{orgs.length} organizations on the platform</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Organization
                </Button>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                    {error}
                </div>
            )}

            {/* Org list */}
            <div className="grid gap-4">
                {orgs.map((org) => (
                    <div key={org._id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold">{org.name}</h3>
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                                            {org.organizationId}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                            org.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                            {org.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm">{org.adminEmail}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {org.stats?.userCount || 0} users
                                        </span>
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" /> {org.stats?.courseCount || 0} courses
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-white gap-1"
                                    onClick={() => setShowPassphraseModal(org._id)}
                                >
                                    <Key className="w-4 h-4" /> Reset Passphrase
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={org.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                                    onClick={() => handleToggleActive(org)}
                                >
                                    {org.isActive
                                        ? <><ToggleRight className="w-4 h-4 mr-1" /> Deactivate</>
                                        : <><ToggleLeft className="w-4 h-4 mr-1" /> Activate</>
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {orgs.length === 0 && (
                    <div className="text-center py-16 text-slate-600">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No organizations yet. Create one to get started.</p>
                    </div>
                )}
            </div>

            {/* Create org modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-white font-bold text-lg mb-4">Create Organization</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Organization Name *</Label>
                                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                                    placeholder="ABC College" required className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Admin Email *</Label>
                                <Input type="email" value={form.adminEmail} onChange={(e) => setForm({...form, adminEmail: e.target.value})}
                                    placeholder="admin@abccollege.com" required className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Portal Passphrase * (for admin login gate)</Label>
                                <Input type="password" value={form.adminPassphrase} onChange={(e) => setForm({...form, adminPassphrase: e.target.value})}
                                    placeholder="Set a passphrase for this org" required className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Admin Name (optional)</Label>
                                <Input value={form.adminName} onChange={(e) => setForm({...form, adminName: e.target.value})}
                                    placeholder="John Doe" className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Admin Password (optional — auto-generated if empty)</Label>
                                <Input type="password" value={form.adminPassword} onChange={(e) => setForm({...form, adminPassword: e.target.value})}
                                    placeholder="Leave empty to auto-generate" className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="ghost" className="flex-1 text-slate-400"
                                    onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1">Create</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset passphrase modal */}
            {showPassphraseModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
                        <h2 className="text-white font-bold text-lg mb-4">Reset Portal Passphrase</h2>
                        <div className="space-y-4">
                            <Input type="password" value={newPassphrase} onChange={(e) => setNewPassphrase(e.target.value)}
                                placeholder="New passphrase" className="bg-slate-800 border-slate-700 text-white" />
                            <div className="flex gap-3">
                                <Button variant="ghost" className="flex-1 text-slate-400"
                                    onClick={() => { setShowPassphraseModal(null); setNewPassphrase(''); }}>Cancel</Button>
                                <Button className="flex-1" onClick={() => handleResetPassphrase(showPassphraseModal)}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
