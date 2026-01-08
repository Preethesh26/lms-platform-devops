import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSearch, ShieldCheck, ArrowRight, Loader2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function AccountResolver() {
    const navigate = useNavigate();
    const { impersonateUser } = useStore();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImpersonate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        const loadingToast = toast.loading("Launching remote session...");

        try {
            const result = await impersonateUser(email);
            toast.success("Session synchronized successfully!", {
                description: `You are now logged in as ${email}`
            });

            // Redirect based on user role
            if (result.role === 'admin' || result.role === 'superadmin') {
                navigate("/admin/dashboard");
            } else {
                navigate("/my-learning");
            }
        } catch (error: any) {
            toast.error("Session sync failed", {
                description: error.message
            });
        } finally {
            setIsLoading(false);
            toast.dismiss(loadingToast);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Super Admin Privilege</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2">Account Resolver</h1>
                <p className="text-muted-foreground text-lg font-medium max-w-2xl">
                    Direct access portal. Enter a user's Gmail to resolve their issues by accessing their profile directly without credentials.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7">
                    <Card className="rounded-[2.5rem] border-2 border-indigo-500/10 shadow-2xl shadow-indigo-500/5 bg-white dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-white relative">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <UserSearch className="w-32 h-32" />
                            </div>
                            <CardHeader className="p-0 space-y-2">
                                <CardTitle className="text-3xl font-black">Sync Session</CardTitle>
                                <CardDescription className="text-indigo-100 font-medium text-base">
                                    Target identification required for direct entry.
                                </CardDescription>
                            </CardHeader>
                        </div>
                        <CardContent className="p-10">
                            <form onSubmit={handleImpersonate} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Target Email Address
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="student@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-14 md:h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 pl-14 text-lg font-medium transition-all group-hover:bg-white dark:group-hover:bg-slate-800"
                                            required
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 md:h-16 rounded-2xl text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all group"
                                    disabled={isLoading || !email}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            Resolve Account
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="p-8 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 space-y-4">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Protocol Notice</h3>
                        </div>
                        <p className="text-sm font-medium text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                            This action will terminate your current administrative session and swap it with the target user's session. You will need to log back in as an admin to regain terminal access.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                        <h3 className="font-black text-xs uppercase tracking-widest text-indigo-500/70">Operation Guidelines</h3>
                        <ul className="space-y-3 text-sm font-medium text-slate-500">
                            <li className="flex gap-3">
                                <span className="text-indigo-500 mt-1">•</span>
                                <span>Resolve enrollment and course access issues manually.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-500 mt-1">•</span>
                                <span>Verify completion of tests or quizzes.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-500 mt-1">•</span>
                                <span>Support students with UI/UX difficulties.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
