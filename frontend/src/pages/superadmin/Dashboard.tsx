import { useState, useEffect } from 'react';
import {
    Building2, Plus, ToggleLeft, ToggleRight, Key, Users, BookOpen,
    ArrowLeft, Trash2, Edit2, UserPlus, Eye, EyeOff, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    getOrganizations, createOrganization, updateOrganization, deleteOrganization,
    getOrgUsers, createOrgUser, updateOrgUser, deleteOrgUser, getOrgCourses
} from '@/lib/superAdminApi';

interface Org {
    _id: string;
    organizationId: string;
    name: string;
    adminEmail: string;
    isActive: boolean;
    createdAt: string;
    orgSuperAdmin: {
        name: string;
        email: string;
        enrollment: string;
        createdAt: string;
    } | null;
    stats: { userCount: number; courseCount: number };
}

interface OrgUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    enrollment: string;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function OrgDetail({ org, onBack, onRefresh }: { org: Org; onBack: () => void; onRefresh: () => void }) {
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [tab, setTab] = useState<'users' | 'courses'>('users');
    const [loading, setLoading] = useState(true);
    const [showAddUser, setShowAddUser] = useState(false);
    const [editUser, setEditUser] = useState<OrgUser | null>(null);
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [newPassphrase, setNewPassphrase] = useState('');
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, coursesRes] = await Promise.all([getOrgUsers(org._id), getOrgCourses(org._id)]);
            setUsers(usersRes.data.data);
            setCourses(coursesRes.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [org._id]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createOrgUser(org._id, userForm);
            setShowAddUser(false);
            setUserForm({ name: '', email: '', password: '', role: 'user' });
            fetchData();
        } catch (err: any) { setError(err.response?.data?.message || 'Failed to create user'); }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        try {
            await updateOrgUser(org._id, editUser._id, { name: editUser.name, email: editUser.email, role: editUser.role });
            setEditUser(null);
            fetchData();
        } catch (err: any) { setError(err.response?.data?.message || 'Failed to update user'); }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Delete this user?')) return;
        try { await deleteOrgUser(org._id, userId); fetchData(); }
        catch (err: any) { setError(err.response?.data?.message || 'Failed to delete user'); }
    };

    const handleResetPassphrase = async () => {
        if (!newPassphrase) return;
        try {
            await updateOrganization(org._id, { adminPassphrase: newPassphrase });
            setShowPassphrase(false);
            setNewPassphrase('');
        } catch (err: any) { setError(err.response?.data?.message || 'Failed to reset passphrase'); }
    };

    const roleColor = (role: string) => {
        if (role === 'org_superadmin') return 'bg-orange-500/10 text-orange-400';
        if (role === 'admin') return 'bg-blue-500/10 text-blue-400';
        if (role === 'superadmin') return 'bg-purple-500/10 text-purple-400';
        return 'bg-slate-700 text-slate-400';
    };

    const roleLabel = (role: string) => {
        if (role === 'org_superadmin') return 'Org Super Admin';
        if (role === 'admin') return 'Admin';
        if (role === 'superadmin') return 'Platform Super Admin';
        return 'Student';
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white p-0 h-auto gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Organizations
            </Button>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-white font-bold text-xl">{org.name}</h2>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{org.organizationId}</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${org.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {org.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm mt-1">{org.adminEmail}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-slate-400 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> {users.length} users</span>
                                <span className="text-slate-400 text-xs flex items-center gap-1"><BookOpen className="w-3 h-3" /> {courses.length} courses</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1" onClick={() => setShowPassphrase(true)}>
                            <Key className="w-4 h-4" /> Reset Passphrase
                        </Button>
                        <Button variant="ghost" size="sm"
                            className={org.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                            onClick={async () => { await updateOrganization(org._id, { isActive: !org.isActive }); onRefresh(); onBack(); }}>
                            {org.isActive ? <><ToggleRight className="w-4 h-4 mr-1" />Deactivate</> : <><ToggleLeft className="w-4 h-4 mr-1" />Activate</>}
                        </Button>
                    </div>
                </div>
            </div>

            {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

            {/* Org Super Admin credentials */}
            {org.orgSuperAdmin && (
                <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <h3 className="text-orange-400 font-bold text-sm uppercase tracking-widest">Org Super Admin</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs mb-1">Name</p>
                            <p className="text-white font-medium">{org.orgSuperAdmin.name}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs mb-1">Email</p>
                            <p className="text-white font-mono">{org.orgSuperAdmin.email}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs mb-1">Enrollment ID</p>
                            <p className="text-white font-mono">{org.orgSuperAdmin.enrollment}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs mb-1">Login credentials</p>
                            <p className="text-slate-400 text-xs">Org ID: <span className="text-white font-mono">{org.organizationId}</span></p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 border-b border-slate-800">
                {(['users', 'courses'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-bold capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'users' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold">{users.length} Users</h3>
                        <Button size="sm" onClick={() => setShowAddUser(true)} className="gap-1">
                            <UserPlus className="w-4 h-4" /> Add User
                        </Button>
                    </div>
                    {loading ? <p className="text-slate-500 text-sm">Loading...</p> : (
                        <div className="space-y-2">
                            {/* Show org super admin first */}
                            {users.filter(u => u.role === 'org_superadmin').map(user => (
                                <div key={user._id} className="bg-slate-800 border border-orange-500/30 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white text-sm font-medium">{user.name}</p>
                                                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-bold">Org Super Admin</span>
                                            </div>
                                            <p className="text-slate-500 text-xs">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white h-8 w-8 p-0" onClick={() => setEditUser(user)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {/* Then show admins and users */}
                            {users.filter(u => u.role !== 'org_superadmin').map(user => (
                                <div key={user._id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{user.name}</p>
                                            <p className="text-slate-500 text-xs">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${roleColor(user.role)}`}>{roleLabel(user.role)}</span>
                                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white h-8 w-8 p-0" onClick={() => setEditUser(user)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-400 h-8 w-8 p-0" onClick={() => handleDeleteUser(user._id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && <p className="text-slate-600 text-sm text-center py-8">No users yet.</p>}
                        </div>
                    )}
                </div>
            )}

            {tab === 'courses' && (
                <div className="space-y-4">
                    <h3 className="text-white font-bold">{courses.length} Courses</h3>
                    {loading ? <p className="text-slate-500 text-sm">Loading...</p> : (
                        <div className="space-y-2">
                            {courses.map((course: any) => (
                                <div key={course._id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{course.title}</p>
                                        <p className="text-slate-500 text-xs">₹{course.price} · {course.lessons?.length || 0} lessons</p>
                                    </div>
                                </div>
                            ))}
                            {courses.length === 0 && <p className="text-slate-600 text-sm text-center py-8">No courses yet.</p>}
                        </div>
                    )}
                </div>
            )}

            {showAddUser && (
                <Modal title="Add User" onClose={() => setShowAddUser(false)}>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Name *</Label>
                            <Input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                                placeholder="John Doe" required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Email *</Label>
                            <Input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}
                                placeholder="john@org.com" required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Password *</Label>
                            <div className="relative">
                                <Input type={showPass ? 'text' : 'password'} value={userForm.password}
                                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                                    placeholder="Password" required className="bg-slate-800 border-slate-700 text-white pr-10" />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Role</Label>
                            <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                                <option value="user">Student (User)</option>
                                <option value="admin">Admin (manages courses & users)</option>
                            </select>
                            <p className="text-slate-600 text-xs">Org Super Admin is created by the platform super admin only.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" className="flex-1 text-slate-400" onClick={() => setShowAddUser(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Add User</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {editUser && (
                <Modal title="Edit User" onClose={() => setEditUser(null)}>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Name</Label>
                            <Input value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})}
                                className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Email</Label>
                            <Input type="email" value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})}
                                className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Role</Label>
                            <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                                <option value="user">User (Student)</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" className="flex-1 text-slate-400" onClick={() => setEditUser(null)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Save</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {showPassphrase && (
                <Modal title="Reset Portal Passphrase" onClose={() => setShowPassphrase(false)}>
                    <div className="space-y-4">
                        <Input type="password" value={newPassphrase} onChange={e => setNewPassphrase(e.target.value)}
                            placeholder="New passphrase" className="bg-slate-800 border-slate-700 text-white" />
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 text-slate-400" onClick={() => setShowPassphrase(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleResetPassphrase}>Reset</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function SuperAdminDashboard() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', adminEmail: '', adminPassphrase: '', adminName: '', adminPassword: '' });

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

    const handleDelete = async (org: Org, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
        try { await deleteOrganization(org._id); fetchOrgs(); }
        catch (err: any) { setError(err.response?.data?.message || 'Failed to delete organization'); }
    };

    if (selectedOrg) {
        return <OrgDetail org={selectedOrg} onBack={() => setSelectedOrg(null)} onRefresh={fetchOrgs} />;
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Organizations</p>
                    <p className="text-white text-3xl font-bold mt-1">{orgs.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Active</p>
                    <p className="text-green-400 text-3xl font-bold mt-1">{orgs.filter(o => o.isActive).length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Total Users</p>
                    <p className="text-white text-3xl font-bold mt-1">{orgs.reduce((a, o) => a + (o.stats?.userCount || 0), 0)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-white text-xl font-bold">All Organizations</h1>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Organization
                </Button>
            </div>

            {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orgs.map(org => (
                    <div key={org._id} onClick={() => setSelectedOrg(org)}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:bg-slate-800/50 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold">{org.name}</h3>
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{org.organizationId}</span>
                                    </div>
                                    <p className="text-slate-500 text-xs mt-0.5">{org.adminEmail}</p>
                                    {org.orgSuperAdmin && (
                                        <p className="text-orange-400 text-xs mt-0.5 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                                            Org SA: {org.orgSuperAdmin.name} ({org.orgSuperAdmin.email})
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${org.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {org.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-400 h-7 w-7 p-0"
                                    onClick={e => handleDelete(org, e)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                            <span className="text-slate-400 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> {org.stats?.userCount || 0} users</span>
                            <span className="text-slate-400 text-xs flex items-center gap-1"><BookOpen className="w-3 h-3" /> {org.stats?.courseCount || 0} courses</span>
                            <span className="text-slate-400 text-xs ml-auto group-hover:text-primary transition-colors">Click to manage →</span>
                        </div>
                    </div>
                ))}
                {orgs.length === 0 && (
                    <div className="col-span-2 text-center py-16 text-slate-600">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No organizations yet. Create one to get started.</p>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <Modal title="Create Organization" onClose={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Organization Name *</Label>
                            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="ABC College" required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Admin Email *</Label>
                            <Input type="email" value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})}
                                placeholder="admin@abccollege.com" required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Portal Passphrase *</Label>
                            <Input type="password" value={form.adminPassphrase} onChange={e => setForm({...form, adminPassphrase: e.target.value})}
                                placeholder="Set a passphrase" required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Admin Name (optional)</Label>
                            <Input value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})}
                                placeholder="John Doe" className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Admin Password (auto-generated if empty)</Label>
                            <Input type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})}
                                placeholder="Leave empty to auto-generate" className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" className="flex-1 text-slate-400" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Create</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
