import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, Search, Mail, Fingerprint, Shield, Trash2, Edit2, ShieldAlert, Loader2 } from "lucide-react";
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

    const [selectedRole, setSelectedRole] = useState("user");
    const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
    const [createdUserCredentials, setCreatedUserCredentials] = useState<{ email: string, password: string, enrollment?: string } | null>(null);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.enrollment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const admins = filteredUsers.filter(u => u.role === 'admin');
    const students = filteredUsers.filter(u => u.role === 'user');

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const enrollment = formData.get("enrollment") as string;

        try {
            await addUser({
                name: formData.get("name") as string,
                email,
                password,
                enrollment,
                role: selectedRole,
            });

            setCreatedUserCredentials({ email, password, enrollment });
            setIsCreateOpen(false);
            toast.success("Identity profile established.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUser) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await updateUser(selectedUser.id, {
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                role: selectedRole as "admin" | "user",
                enrollment: formData.get("enrollment") as string,
                password: (formData.get("password") as string) || undefined,
                enrolledCourses: selectedEnrollments
            });
            setSelectedUser(null);
            toast.success("Profile refined successfully.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you certain you wish to purge this directory entry? This action is irreversible.")) return;
        try {
            await deleteUser(id);
            toast.success("Profile purged from registry.");
        } catch (err: any) {
            toast.error("Failed to delete profile.");
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold tracking-tight">Student Registry</h2>
                    <p className="text-muted-foreground font-medium">Manage institutional identities and academic access.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by name, email, or ID..."
                            className="pl-11 h-12 rounded-xl bg-white border-none shadow-sm transition-all focus-within:shadow-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 rounded-xl font-bold w-full sm:w-auto bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                <UserPlus className="mr-2 h-4 w-4" /> Issue Credentials
                            </Button>
                        </DialogTrigger>
                        <DialogContent key={isCreateOpen ? 'create' : 'closed'} className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative">
                                <Shield className="absolute top-0 right-0 p-8 opacity-10 w-24 h-24" />
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Member Onboarding</DialogTitle>
                                    <DialogDescription className="text-indigo-100 font-medium">Assign a new user to the institutional directory.</DialogDescription>
                                </DialogHeader>
                            </div>
                            <form onSubmit={handleCreate} className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Full Identity</Label>
                                    <Input name="name" placeholder="Johnathan Doe" className="h-12 rounded-xl" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Liaison Email</Label>
                                    <Input name="email" type="email" placeholder="j.doe@institution.edu" className="h-12 rounded-xl" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Access Key</Label>
                                        <Input name="password" type="password" placeholder="••••••••" className="h-12 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Registry ID</Label>
                                        <Input name="enrollment" placeholder="LMS-2024" className="h-12 rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Authorization Tier</Label>
                                    <Tabs defaultValue="user" onValueChange={setSelectedRole} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
                                            <TabsTrigger value="user" className="rounded-lg font-bold">Scholar</TabsTrigger>
                                            <TabsTrigger value="admin" className="rounded-lg font-bold">Overseer</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-bold gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                        Initialize Profile
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Success Dialog for new user credentials */}
            <Dialog open={!!createdUserCredentials} onOpenChange={(open) => !open && setCreatedUserCredentials(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden text-center">
                    <div className="bg-emerald-500 p-8 text-white relative">
                        <UserPlus className="w-16 h-16 mx-auto opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        <h3 className="text-2xl font-bold relative z-10">Access Provisioned</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-sm text-muted-foreground font-medium">The member has been enrolled. Please securely relay these credentials.</p>
                        <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Registry ID</p>
                                <p className="text-lg font-mono font-bold text-slate-900">{createdUserCredentials?.enrollment || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Access Email</p>
                                <p className="text-sm font-bold text-slate-700">{createdUserCredentials?.email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Master Secret</p>
                                <p className="text-sm font-bold text-slate-700">{createdUserCredentials?.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => setCreatedUserCredentials(null)} className="w-full h-12 rounded-xl font-bold">Acknowledge</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Tabs */}
            <Tabs defaultValue="students" className="space-y-6">
                <TabsList className="bg-white border-none shadow-sm p-1.5 gap-2 rounded-2xl h-14 w-full sm:w-auto flex">
                    <TabsTrigger value="students" className="flex-1 sm:flex-none px-6 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Scholars <Badge variant="secondary" className="ml-2 rounded-lg opacity-80">{students.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="admins" className="flex-1 sm:flex-none px-6 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Directors <Badge variant="secondary" className="ml-2 rounded-lg opacity-80">{admins.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {students.map(user => (
                            <UserCard key={user.id} user={user} onEdit={() => {
                                setSelectedUser(user);
                                setSelectedRole(user.role);
                                setSelectedEnrollments(user.enrolledCourses || []);
                            }} onDelete={() => handleDelete(user.id)} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="admins" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {admins.map(user => (
                            <UserCard key={user.id} user={user} onEdit={() => {
                                setSelectedUser(user);
                                setSelectedRole(user.role);
                            }} onDelete={() => handleDelete(user.id)} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit User Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent key={selectedUser?.id} className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative">
                        <Edit2 className="absolute top-0 right-0 p-8 opacity-10 w-24 h-24" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Refine Identity</DialogTitle>
                            <DialogDescription className="text-indigo-100 font-medium">Modifying credentials for {selectedUser?.name}</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleUpdate} className="p-8 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Full Identity</Label>
                            <Input name="name" defaultValue={selectedUser?.name} className="h-12 rounded-xl" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Liaison Email</Label>
                            <Input name="email" type="email" defaultValue={selectedUser?.email} className="h-12 rounded-xl" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-primary">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Update Secret</Label>
                                <Input name="password" type="password" placeholder="Leave empty to retain" className="h-12 rounded-xl border-indigo-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Registry ID</Label>
                                <Input name="enrollment" defaultValue={selectedUser?.enrollment} className="h-12 rounded-xl" />
                            </div>
                        </div>

                        {selectedUser?.role === 'user' && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">Academic Privileges</Label>
                                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 max-h-[160px] overflow-auto space-y-2">
                                    {courses.map(course => (
                                        <div key={course.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`c-${course.id}`}
                                                checked={selectedEnrollments.includes(course.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedEnrollments([...selectedEnrollments, course.id]);
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
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Refinements
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserCard({ user, onEdit, onDelete }: { user: User, onEdit: () => void, onDelete: () => void }) {
    return (
        <Card className="group overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all bg-white relative">
            <CardHeader className="p-6 pb-2">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <Fingerprint className="w-6 h-6" />}
                    </div>
                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="rounded-lg font-bold h-7 px-3">
                        {user.role}
                    </Badge>
                </div>
                <div className="mt-4 space-y-1">
                    <h3 className="font-extrabold text-lg line-clamp-1">{user.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium truncate">{user.email}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-bold uppercase tracking-wider">ID</span>
                        <span className="font-mono font-bold text-foreground bg-slate-100 px-2 py-0.5 rounded">{user.enrollment || 'UNASSIGNED'}</span>
                    </div>
                    {user.role === 'user' && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-bold uppercase tracking-wider">Academic Load</span>
                            <span className="font-bold text-primary">{user.enrolledCourses?.length || 0} Courses</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 font-bold border-slate-100 hover:bg-slate-50" onClick={onEdit}>
                    Refine
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
