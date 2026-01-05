import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Mail, Fingerprint, Shield, Trash2, Edit2, Loader2, Eye, EyeOff, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, type User } from "@/lib/store";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const { users, courses, addUser, updateUser, deleteUser, isInitialized, error: fetchError, refetchUsers } = useStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [selectedRole, setSelectedRole] = useState("user");
    const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
    const [createdUserCredentials, setCreatedUserCredentials] = useState<{ email: string, password: string, enrollment?: string } | null>(null);
    const [generatedId, setGeneratedId] = useState("");

    // Password visibility state
    const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.enrollment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const admins = filteredUsers.filter(u => u.role === 'admin');
    const students = filteredUsers.filter(u => u.role === 'user');

    const [generatedPassword, setGeneratedPassword] = useState("");

    const generateId = () => {
        const year = new Date().getFullYear();
        const prefix = `LMS-${year}-`;

        // Find existing IDs with current year prefix
        const existingIds = users
            .filter(u => u.enrollment && u.enrollment.startsWith(prefix))
            .map(u => {
                const parts = u.enrollment.split('-');
                return parseInt(parts[2] || '0');
            });

        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const nextId = (maxId + 1).toString().padStart(4, '0');

        return `${prefix}${nextId}`;
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        // Use generated password instead of form input if available, though form input should match
        const password = formData.get("password") as string;
        const enrollment = formData.get("enrollment") as string;

        try {
            await addUser({
                name: formData.get("name") as string,
                email,
                password,
                enrollment: selectedRole === 'admin' ? undefined : enrollment,
                role: selectedRole,
                needsPasswordReset: selectedRole === 'user', // Enforce reset for students only
            });

            setCreatedUserCredentials({ email, password, enrollment });
            setIsCreateOpen(false);
            toast.success("User created successfully.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUser) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const resetRequired = formData.get("needsPasswordReset") === "on";

        try {
            await updateUser(selectedUser.id, {
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                role: selectedRole as "admin" | "user",
                enrollment: formData.get("enrollment") as string,
                password: (formData.get("password") as string) || undefined,
                enrolledCourses: selectedEnrollments,
                needsPasswordReset: resetRequired
            });
            setSelectedUser(null);
            toast.success("User updated successfully.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteConfirmation("");
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        if (deleteConfirmation !== userToDelete.email) {
            toast.error("Email does not match. Please type the exact email to confirm.");
            return;
        }

        try {
            await deleteUser(userToDelete.id);
            toast.success("User deleted.");
            setUserToDelete(null);
        } catch (err: any) {
            toast.error("Failed to delete user.");
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground font-medium">Manage user access and roles.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search users..."
                            className="pl-11 h-12 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm dark:shadow-slate-900/50 transition-all focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20 dark:text-white"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={(open: boolean) => {
                        setIsCreateOpen(open);
                        if (open) {
                            setGeneratedId(generateId());
                            setGeneratedPassword(generatePassword());
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 rounded-xl font-bold w-full sm:w-auto bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                <UserPlus className="mr-2 h-4 w-4" /> Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent key={isCreateOpen ? 'create' : 'closed'} className="sm:max-w-[500px] rounded-[2.5rem] border-2 border-indigo-500/20 dark:border-indigo-500/50 shadow-2xl p-0 overflow-hidden">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative">
                                <Shield className="absolute top-0 right-0 p-8 opacity-10 w-24 h-24" />
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Add New User</DialogTitle>
                                    <DialogDescription className="text-indigo-100 font-medium">Create a new user account.</DialogDescription>
                                </DialogHeader>
                            </div>
                            <form onSubmit={handleCreate} className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Name</Label>
                                    <Input name="name" placeholder="Enter full name" className="h-12 rounded-xl" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Email</Label>
                                    <Input name="email" type="email" placeholder="Enter email address" className="h-12 rounded-xl" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Password</Label>
                                        <div className="relative">
                                            <Input
                                                name="password"
                                                type={showGeneratedPassword ? "text" : "password"}
                                                value={selectedRole === 'user' ? generatedPassword : undefined}
                                                onChange={selectedRole === 'admin' ? (e) => setGeneratedPassword(e.target.value) : undefined}
                                                readOnly={selectedRole === 'user'}
                                                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white font-mono pr-10"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                                            >
                                                {showGeneratedPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground px-1">
                                            {selectedRole === 'user' ? "Auto-generated secure password (Reset required on login)" : "Enter a password for the new admin"}
                                        </p>
                                    </div>
                                    {selectedRole === 'user' ? (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">User ID</Label>
                                            <Input name="enrollment" defaultValue={generatedId} className="h-12 rounded-xl" readOnly />
                                        </div>
                                    ) : (
                                        <div className="space-y-2 opacity-30 select-none">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest px-1">User ID</Label>
                                            <Input placeholder="Not required for Admin" className="h-12 rounded-xl bg-slate-100" disabled />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Role</Label>
                                    <Tabs defaultValue="user" onValueChange={setSelectedRole} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
                                            <TabsTrigger value="user" className="rounded-lg font-bold">User</TabsTrigger>
                                            <TabsTrigger value="admin" className="rounded-lg font-bold">Admin</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-bold gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                        Create User
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Success Dialog for new user credentials */}
            <Dialog open={!!createdUserCredentials} onOpenChange={(open) => !open && setCreatedUserCredentials(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-2 border-emerald-500/20 dark:border-emerald-500/50 shadow-2xl p-0 overflow-hidden text-center">
                    <div className="bg-emerald-500 p-8 text-white relative">
                        <UserPlus className="w-16 h-16 mx-auto opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        <h3 className="text-2xl font-bold relative z-10">User Created</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-sm text-muted-foreground font-medium">The user has been successfully created.</p>
                        <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">User ID</p>
                                <p className="text-lg font-mono font-bold text-slate-900">{createdUserCredentials?.enrollment || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Email</p>
                                <p className="text-sm font-bold text-slate-700">{createdUserCredentials?.email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Password</p>
                                <p className="text-sm font-bold text-slate-700">{createdUserCredentials?.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => setCreatedUserCredentials(null)} className="w-full h-12 rounded-xl font-bold">Done</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Tabs */}
            <Tabs defaultValue="students" className="space-y-8">
                <TabsList className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-sm p-1.5 gap-2 rounded-2xl h-16 w-full sm:w-auto flex">
                    <TabsTrigger value="students" className="flex-1 sm:flex-none px-6 rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-md transition-all h-full">
                        Users <Badge variant="secondary" className="ml-2 rounded-lg opacity-80 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{students.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="admins" className="flex-1 sm:flex-none px-6 rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-md transition-all h-full">
                        Admins <Badge variant="secondary" className="ml-2 rounded-lg opacity-80 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{admins.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="space-y-4">
                    {viewMode === 'grid' ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {students.map(user => (
                                <UserCard key={user.id} user={user} onEdit={() => {
                                    setSelectedUser(user);
                                    setSelectedRole(user.role);
                                    setSelectedEnrollments(user.enrolledCourses || []);
                                }} onDelete={() => handleDeleteClick(user)} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                        <TableHead className="pl-6 h-14 font-black text-xs uppercase tracking-widest text-slate-400">User</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Email</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">ID Code</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Courses</TableHead>
                                        <TableHead className="text-right pr-6 font-black text-xs uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-colors">
                                            <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <Fingerprint className="w-4 h-4" />
                                                    </div>
                                                    {user.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-medium text-sm">{user.email}</TableCell>
                                            <TableCell><span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{user.enrollment || '-'}</span></TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-bold bg-primary/10 text-primary hover:bg-primary/20">
                                                    {user.enrolledCourses?.length || 0} enrolled
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => {
                                                        setSelectedUser(user);
                                                        setSelectedRole(user.role);
                                                        setSelectedEnrollments(user.enrolledCourses || []);
                                                    }}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" onClick={() => handleDeleteClick(user)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="admins" className="space-y-4">
                    {viewMode === 'grid' ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {admins.map(user => (
                                <UserCard key={user.id} user={user} onEdit={() => {
                                    setSelectedUser(user);
                                    setSelectedRole(user.role);
                                }} onDelete={() => handleDeleteClick(user)} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                        <TableHead className="pl-6 h-14 font-black text-xs uppercase tracking-widest text-slate-400">Admin User</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Email</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Role</TableHead>
                                        <TableHead className="text-right pr-6 font-black text-xs uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-colors">
                                            <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500">
                                                        <Shield className="w-4 h-4" />
                                                    </div>
                                                    {user.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-medium text-sm">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge className="font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 border-none shadow-none dark:bg-orange-900/30 dark:text-orange-400">
                                                    Administrator
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => {
                                                        setSelectedUser(user);
                                                        setSelectedRole(user.role);
                                                    }}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" onClick={() => handleDeleteClick(user)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit User Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent key={selectedUser?.id} className="sm:max-w-[500px] rounded-[2.5rem] border-2 border-indigo-500/20 dark:border-indigo-500/50 shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative">
                        <Edit2 className="absolute top-0 right-0 p-8 opacity-10 w-24 h-24" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
                            <DialogDescription className="text-indigo-100 font-medium">Edit user details for {selectedUser?.name}</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleUpdate} className="p-8 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Name</Label>
                            <Input name="name" defaultValue={selectedUser?.name} className="h-12 rounded-xl" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Email</Label>
                            <Input name="email" type="email" defaultValue={selectedUser?.email} className="h-12 rounded-xl" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-primary">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Password</Label>
                                <div className="relative">
                                    <Input
                                        name="password"
                                        type={showGeneratedPassword ? "text" : "password"}
                                        className="h-12 rounded-xl border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                                    >
                                        {showGeneratedPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">User ID</Label>
                                <Input name="enrollment" defaultValue={selectedUser?.enrollment} className="h-12 rounded-xl" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <Checkbox id="needsPasswordReset" name="needsPasswordReset" defaultChecked={selectedUser?.needsPasswordReset} />
                            <label
                                htmlFor="needsPasswordReset"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-indigo-900"
                            >
                                Require password reset on next login
                            </label>
                        </div>

                        {selectedUser?.role === 'user' && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Enrolled Courses</Label>
                                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 max-h-[160px] overflow-auto space-y-2">
                                    {courses.map(course => (
                                        <div key={course.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`c-${course.id}`}
                                                checked={selectedEnrollments.includes(course.id)}
                                                onCheckedChange={(checked: boolean | "indeterminate") => {
                                                    if (checked === true) setSelectedEnrollments([...selectedEnrollments, course.id]);
                                                    else setSelectedEnrollments(selectedEnrollments.filter(id => id !== course.id));
                                                }}
                                            />
                                            <label htmlFor={`c-${course.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{course.title}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-bold">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-2 border-red-500/20 dark:border-red-500/50 shadow-2xl p-0 overflow-hidden">
                    <div className="bg-red-500 p-8 text-white relative">
                        <Trash2 className="absolute top-0 right-0 p-8 opacity-20 w-32 h-32" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Delete User</DialogTitle>
                            <DialogDescription className="text-red-100 font-medium opacity-90">
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                To delete <span className="font-bold text-foreground">{userToDelete?.name}</span>, please type their email address (<span className="font-bold text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">{userToDelete?.email}</span>) below to confirm:
                            </p>
                            <Input
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder={userToDelete?.email}
                                className="h-12 rounded-xl text-center font-bold bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:ring-offset-0 focus-visible:ring-red-500/50"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setUserToDelete(null)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                            <Button
                                onClick={confirmDelete}
                                disabled={deleteConfirmation !== userToDelete?.email}
                                className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                            >
                                Delete User
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function UserCard({ user, onEdit, onDelete }: { user: User, onEdit: () => void, onDelete: () => void }) {
    return (
        <Card className="group overflow-hidden rounded-[2.5rem] border-2 border-transparent dark:bg-slate-900/50 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all hover:-translate-y-1 bg-white dark:hover:border-primary/20 relative">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                    Active
                </div>
            </div>
            <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${user.role === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                        {user.role === 'admin' ? <Shield className="w-7 h-7" /> : <Fingerprint className="w-7 h-7" />}
                    </div>
                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="rounded-xl font-bold h-8 px-4 text-[10px] tracking-widest uppercase">
                        {user.role}
                    </Badge>
                </div>
                <div className="mt-6 space-y-1">
                    <h3 className="font-black text-xl line-clamp-1 tracking-tight text-slate-900 dark:text-white">{user.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary/80 transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold truncate tracking-wide">{user.email}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">
                        <span className="text-muted-foreground font-black uppercase tracking-widest opacity-70">ID Code</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{user.enrollment || 'N/A'}</span>
                    </div>
                    {user.role === 'user' && (
                        <div className="flex items-center justify-between text-xs px-3">
                            <span className="text-muted-foreground font-bold uppercase tracking-wider opacity-70">Courses</span>
                            <span className="font-black text-primary">{user.enrolledCourses?.length || 0}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl h-11 font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white" onClick={onEdit}>
                    Edit Profile
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={onDelete}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
    );
}
