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
    const { users, addUser, updateUser, deleteUser, isInitialized } = useStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [error, setError] = useState("");

    const [selectedRole, setSelectedRole] = useState("user");

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);

        try {
            await addUser({
                email: formData.get("email") as string,
                password: formData.get("password") as string,
                enrollment: formData.get("enrollment") as string,
                role: selectedRole,
            });
            setIsCreateOpen(false);
            setSelectedRole("user"); // Reset role
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

        // Only add password if it's provided (not empty)
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
            // You might want to show an error state here
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
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
                                            disabled={user.role === 'admin'} // Prevent deleting admins for safety in this demo
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
                        <DialogDescription>Update user details.</DialogDescription>
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
                                <Input id="edit-password" name="password" type="password" placeholder="Leave blank to keep current" />
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
        </div>
    );
}
