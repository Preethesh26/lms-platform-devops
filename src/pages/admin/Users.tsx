import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useStore } from "@/lib/store";

export default function AdminUsersPage() {
    const { users, addUser, updateUser, deleteUser, isInitialized, error: fetchError, refetchUsers } = useStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [error, setError] = useState("");
    const [createdUserCredentials, setCreatedUserCredentials] = useState<{ email: string, password: string, enrollment?: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [selectedRole, setSelectedRole] = useState("user");

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const enrollment = formData.get("enrollment") as string;

        try {
            await addUser({
                email,
                password,
                enrollment,
                role: selectedRole,
            });

            // Show success dialog with credentials
            setCreatedUserCredentials({
                email,
                password,
                enrollment: selectedRole === 'user' ? enrollment : undefined
            });

            setIsCreateOpen(false);
            setSelectedRole("user");
            e.currentTarget.reset();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create user");
        }
    };

    const [editingUser, setEditingUser] = useState<any>(null);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingUser) return;

        const formData = new FormData(e.currentTarget);
        const updates: any = {
            email: formData.get("email") as string,
            role: selectedRole,
        };

        // Only update password if provided
        const password = formData.get("password") as string;
        if (password) {
            updates.password = password;
        }

        if (selectedRole === 'user') {
            updates.enrollment = formData.get("enrollment") as string;
        }

        try {
            await updateUser(editingUser.id, updates);
            setEditingUser(null);
            setSelectedRole("user");
        } catch (err: any) {
            console.error(err);
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetchUsers()}>
                        Refresh List
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Add User</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>Create a new user account.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="grid gap-4 py-4">
                                    {error && (
                                        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                                            {error}
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <select
                                            name="role"
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="user">Student</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                    </div>
                                    {selectedRole === 'user' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="enrollment">Enrollment Number</Label>
                                            <Input id="enrollment" name="enrollment" placeholder="Required for students" required />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Create User</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {fetchError && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-900">
                    <p className="font-medium">Error loading users</p>
                    <p className="text-sm">{fetchError}</p>
                    <Button variant="link" className="p-0 h-auto text-red-600 underline" onClick={() => refetchUsers()}>
                        Try Again
                    </Button>
                </div>
            )}

            <div className="grid gap-4">
                {users.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">No users found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    users.map((user) => (
                        <Card key={user.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-base">
                                    <div className="flex flex-col">
                                        <span>{user.email}</span>
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {user.role === 'admin' ? 'Administrator' : 'Student'}
                                            {user.enrollment && ` • ${user.enrollment}`}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setSelectedRole(user.role);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteUser(user.id)}
                                            disabled={user.role === 'admin'}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user details and reset password.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <select
                                    id="edit-role"
                                    name="role"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="user">Student</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" name="email" type="email" defaultValue={editingUser?.email} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">New Password (Optional)</Label>
                                <Input id="edit-password" name="password" type="password" placeholder="Leave blank to keep current password" />
                                <p className="text-xs text-muted-foreground">Only enter a password if you want to change it</p>
                            </div>
                            {selectedRole === 'user' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-enrollment">Enrollment Number</Label>
                                    <Input id="edit-enrollment" name="enrollment" defaultValue={editingUser?.enrollment} placeholder="Required for students" required />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Success Dialog - Show Credentials */}
            <Dialog open={!!createdUserCredentials} onOpenChange={(open) => !open && setCreatedUserCredentials(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>✅ User Created Successfully</DialogTitle>
                        <DialogDescription>
                            Please save these credentials and share them with the user. The password will not be shown again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2 p-4 bg-muted rounded-lg">
                            <div>
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <p className="font-mono text-sm font-medium">{createdUserCredentials?.email}</p>
                            </div>
                            {createdUserCredentials?.enrollment && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Enrollment Number</Label>
                                    <p className="font-mono text-sm font-medium">{createdUserCredentials.enrollment}</p>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">Password</Label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {showPassword ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                                Hide
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                Show
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="font-mono text-sm font-medium text-primary">
                                    {showPassword ? createdUserCredentials?.password : '••••••••'}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                            ⚠️ Make sure to copy and save these credentials now. The password is securely hashed in the database and cannot be retrieved later.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            setCreatedUserCredentials(null);
                            setShowPassword(false);
                        }}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
