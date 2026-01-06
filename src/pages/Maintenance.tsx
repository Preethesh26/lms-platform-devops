import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Construction, Lock, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function MaintenancePage() {
    const { currentUser, isDemoMode } = useStore();
    const navigate = useNavigate();

    // If I am an admin, I should be allowed to leave this page
    const isAdmin = currentUser?.role === 'admin';

    const handleBypass = () => {
        if (isAdmin) {
            navigate("/admin/dashboard");
        } else {
            navigate("/admin/login");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative mx-auto w-32 h-32 mb-8">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
                    <div className="relative z-10 w-full h-full bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-yellow-200 dark:border-yellow-700">
                        <Construction className="w-16 h-16 text-yellow-600 dark:text-yellow-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Under Maintenance
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        We're currently updating the platform to make it even better. Please check back soon.
                    </p>
                </div>

                <div className="pt-8">
                    {isAdmin ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    Administrator Access Detected
                                </p>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleBypass}
                                className="w-full font-bold rounded-xl"
                            >
                                Continue to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={handleBypass}
                            className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest font-bold opacity-50 hover:opacity-100"
                        >
                            <Lock className="w-3 h-3 mr-2" />
                            Admin Login
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground mt-12 opacity-60">
                    &copy; {new Date().getFullYear()} AcademyPro LMS
                </p>
            </div>
        </div>
    );
}
