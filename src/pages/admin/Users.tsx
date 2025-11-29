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
    const [activeTab, setActiveTab] = useState("details");

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const form = e.currentTarget; // Store reference before async
        const formData = new FormData(form);

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const enrollment = formData.get("enrollment") as string;

        try {
            await addUser({
                name,
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
            form.reset(); // Use stored reference
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create user");
        }
    };

    const [selectedUser, setSelectedUser] = useState<any>(null);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUser) return;

        const formData = new FormData(e.currentTarget);
        const updates: any = {
            name: formData.get("name") as string,
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
            await updateUser(selectedUser.id, updates);
            setSelectedUser(null);
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
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" name="name" type="text" required />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground text-center">No users found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    users
                        .sort((a, b) => {
                            // Sort by Role (Admin first)
                            if (a.role === 'admin' && b.role !== 'admin') return -1;
                            if (a.role !== 'admin' && b.role === 'admin') return 1;

                            // Then sort by Enrollment (if both are students)
                            if (a.role === 'user' && b.role === 'user') {
                                return (a.enrollment || '').localeCompare(b.enrollment || '');
                            }

                            // Fallback to name
                            return a.name.localeCompare(b.name);
                        })
                        .map((user) => (
                            <Card
                                key={user.id}
                                className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${user.role === 'admin'
                                    ? 'border-l-purple-500 bg-purple-50/30 dark:bg-purple-900/10'
                                    : 'border-l-blue-500 bg-white dark:bg-card'
                                    }`}
                                onClick={() => {
                                    setSelectedUser(user);
                                    setSelectedRole(user.role);
                                    setActiveTab("details");
                                }}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg font-semibold leading-none tracking-tight">
                                                {user.name}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground break-all">
                                                {user.email}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {user.role === 'admin' ? 'Admin' : 'Student'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {user.role === 'user' && (
                                        <div className="space-y-3 mt-2">
                                            <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                <span className="text-muted-foreground">Enrollment:</span>
                                                <span className="font-mono font-medium">{user.enrollment || 'N/A'}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    Performance
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{ width: `${Math.min((user.enrolledCourses?.length || 0) * 10, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium whitespace-nowrap">
                                                        {user.enrolledCourses?.length || 0} Courses
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end mt-4 pt-2 border-t border-border/50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteUser(user.id);
                                            }}
                                            disabled={user.role === 'admin'}
                                        >
                                            Delete User
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                )}
            </div>

            {/* User Details & Edit Dialog */}
            {/* User Details & Edit Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>View and manage user information.</DialogDescription>
                    </DialogHeader>

                    <div className="w-full">
                        <div className="grid w-full grid-cols-2 mb-4 bg-muted p-1 rounded-md">
                            <button
                                onClick={() => setActiveTab("details")}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "details"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50"
                                    }`}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setActiveTab("edit")}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "edit"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50"
                                    }`}
                            >
                                Edit Profile
                            </button>
                        </div>

                        {activeTab === "details" && (
                            <div className="space-y-4 py-4 animate-in fade-in-50 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Name</Label>
                                        <p className="font-medium">{selectedUser?.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Email</Label>
                                        <p className="font-medium">{selectedUser?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Role</Label>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedUser?.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {selectedUser?.role === 'admin' ? 'Administrator' : 'Student'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedUser?.enrollment && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Enrollment Number</Label>
                                            <p className="font-mono text-sm">{selectedUser?.enrollment}</p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Enrolled Courses</Label>
                                        <p className="font-medium">{selectedUser?.enrolledCourses?.length || 0} Courses</p>
                                    </div>
                                </div>

                                {selectedUser?.enrolledCourses?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <Label className="text-xs text-muted-foreground mb-2 block">Course List</Label>
                                        <div className="grid gap-2">
                                            <p className="text-sm text-muted-foreground">
                                                User is enrolled in {selectedUser.enrolledCourses.length} courses.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "edit" && (
                            <div className="animate-in fade-in-50 duration-300">
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
                                            <Label htmlFor="edit-name">Name</Label>
                                            <Input id="edit-name" name="name" type="text" defaultValue={selectedUser?.name} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-email">Email</Label>
                                            <Input id="edit-email" name="email" type="email" defaultValue={selectedUser?.email} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-password">New Password (Optional)</Label>
                                            <Input id="edit-password" name="password" type="password" placeholder="Leave blank to keep current password" />
                                            <p className="text-xs text-muted-foreground">Only enter a password if you want to change it</p>
                                        </div>
                                        {selectedRole === 'user' && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-enrollment">Enrollment Number</Label>
                                                <Input id="edit-enrollment" name="enrollment" defaultValue={selectedUser?.enrollment} placeholder="Required for students" required />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Save Changes</Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Dialog - Show Credentials */}
            <Dialog open={!!createdUserCredentials} onOpenChange={(open) => !open && setCreatedUserCredentials(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>✅ User Created Successfully</DialogTitle>
                        <DialogDescription>
                            A welcome email with these credentials has been sent to the user's email address. Please save these credentials as backup.
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
                        <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                            📧 A welcome email has been sent to the user with their login credentials. You can also save these credentials as backup.
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
