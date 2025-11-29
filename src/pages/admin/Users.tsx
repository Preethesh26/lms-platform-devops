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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

            {/* Administrators Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">Administrators</h3>
                    <span className="text-sm text-muted-foreground">({users.filter(u => u.role === 'admin').length})</span>
                </div>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {users.filter(u => u.role === 'admin').length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">No administrators found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        users.filter(u => u.role === 'admin').map((user) => (
                            <Card
                                key={user.id}
                                className="cursor-pointer hover:bg-muted/50 transition-all hover:scale-[1.02] hover:shadow-md aspect-square flex flex-col justify-between"
                                onClick={() => {
                                    setSelectedUser(user);
                                    setSelectedRole(user.role);
                                }}
                            >
                                <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
                                    <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg truncate w-full max-w-[200px]">{user.name || 'Unknown User'}</h3>
                                        <p className="text-sm text-muted-foreground truncate w-full max-w-[200px]">{user.email}</p>
                                        <div className="pt-2">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                Administrator
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-6 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteUser(user.id);
                                        }}
                                        disabled={true}
                                    >
                                        Delete User
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Students Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">Students</h3>
                    <span className="text-sm text-muted-foreground">({users.filter(u => u.role === 'user').length})</span>
                </div>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {users.filter(u => u.role === 'user').length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">No students found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        users.filter(u => u.role === 'user').map((user) => (
                            <Card
                                key={user.id}
                                className="cursor-pointer hover:bg-muted/50 transition-all hover:scale-[1.02] hover:shadow-md aspect-square flex flex-col justify-between"
                                onClick={() => {
                                    setSelectedUser(user);
                                    setSelectedRole(user.role);
                                }}
                            >
                                <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
                                    <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg truncate w-full max-w-[200px]">{user.name || 'Unknown User'}</h3>
                                        <p className="text-sm text-muted-foreground truncate w-full max-w-[200px]">{user.email}</p>
                                        <div className="pt-2">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                Student
                                            </span>
                                        </div>
                                        {user.enrollment && (
                                            <p className="text-xs font-mono text-muted-foreground pt-1">{user.enrollment}</p>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-6 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteUser(user.id);
                                        }}
                                        disabled={false}
                                    >
                                        Delete User
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* User Details & Edit Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>View and manage user information.</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4 py-4">
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
                                        {/* Since enrolledCourses is just IDs in the user object currently, 
                                            we might need to populate this or just show count. 
                                            For now showing count is safer unless we populate on backend. */}
                                        <p className="text-sm text-muted-foreground">
                                            User is enrolled in {selectedUser.enrolledCourses.length} courses.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="edit">
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
                        </TabsContent>
                    </Tabs>
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
