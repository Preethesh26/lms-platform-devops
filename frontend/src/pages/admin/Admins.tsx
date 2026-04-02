// ============================================================
// MANAGE ADMINS PAGE — for org_superadmin only
// Shows only admin users within the org
// Allows creating, editing, deleting admin accounts
// ============================================================

import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { usersAPI } from '@/lib/api';

interface AdminUser {
    id: string;
    _id: string;
    name: string;
    email: string;
    role: string;
    enrollment: string;
    twoFactorEnabled?: boolean;
}

export default function ManageAdmins() {
    const { users, currentUser, addUser, updateUser, deleteUser, refetchUsers } = useStore();
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });

    // Filter only admin users (not org_superadmin, not students)
    const adminUsers = users.filter(u => u.role === 'admin');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await usersAPI.createAdmin({ name: form.name, email: form.email, password: form.password });
            setShowCreate(false);
            setForm({ name: '', email: '', password: '' });
            await refetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        setError('');
        setLoading(true);
        try {
            await updateUser(editUser.id || editUser._id, {
                name: editForm.name,
                email: editForm.email,
                ...(editForm.password ? { password: editForm.password } : {})
            });
            setEditUser(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update admin');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user: AdminUser) => {
        if (!confirm(`Remove admin "${user.name}"? They will lose admin access.`)) return;
        try {
            await deleteUser(user.id || user._id);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete admin');
        }
    };

    const openEdit = (user: AdminUser) => {
        setEditUser(user);
        setEditForm({ name: user.name, email: user.email, password: '' });
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Manage Admins</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {adminUsers.length} admin{adminUsers.length !== 1 ? 's' : ''} in your organization
                    </p>
                </div>
                <Button onClick={() => { setShowCreate(true); setError(''); }} className="gap-2">
                    <UserPlus className="h-4 w-4" /> Add Admin
                </Button>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                    {error}
                </div>
            )}

            {/* Admin list */}
            <div className="space-y-3">
                {adminUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">{user.name}</p>
                                <p className="text-muted-foreground text-xs">{user.email}</p>
                                {user.enrollment && (
                                    <p className="text-muted-foreground text-xs font-mono">{user.enrollment}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold">
                                Staff Admin
                            </span>
                            {user.twoFactorEnabled && (
                                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold">
                                    2FA On
                                </span>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => openEdit(user as AdminUser)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() => handleDelete(user as AdminUser)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {adminUsers.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No admins yet</p>
                        <p className="text-sm mt-1">Add an admin to help manage your organization</p>
                    </div>
                )}
            </div>

            {/* Create Admin Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Staff Admin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                placeholder="admin@org.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <div className="relative">
                                <Input type={showPass ? 'text' : 'password'} value={form.password}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                    placeholder="Set a password" required className="pr-10" />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Admin'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Admin Dialog */}
            <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Admin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password (leave empty to keep current)</Label>
                            <Input type="password" value={editForm.password}
                                onChange={e => setEditForm({...editForm, password: e.target.value})}
                                placeholder="Leave empty to keep current" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
                            <Button type="submit" className="flex-1" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
