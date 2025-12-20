import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function AdminLayout() {
    const navigate = useNavigate();
    const { currentUser, logoutUser, isInitialized } = useStore();

    useEffect(() => {
        if (isInitialized) {
            if (!currentUser || currentUser.role !== 'admin') {
                navigate("/admin/login");
            }
        }
    }, [currentUser, isInitialized, navigate]);

    if (!isInitialized) return null;

    // If not admin (and waiting for redirect), don't render content
    if (!currentUser || currentUser.role !== 'admin') return null;

    return (
        <div className="min-h-screen flex bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className="w-72 border-r bg-white hidden md:flex flex-col shadow-sm">
                <div className="flex h-20 items-center px-8">
                    <Link to="/admin" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-xl tracking-tight">LMS Admin</span>
                    </Link>
                </div>
                <nav className="flex flex-col gap-1.5 p-6 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 px-3">Management</p>
                    {[
                        { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
                        { to: "/admin/courses", label: "Course Catalog", icon: "📚" },
                        { to: "/admin/users", label: "Student Registry", icon: "👥" },
                        { to: "/admin/quizzes", label: "Quizzes", icon: "📝" },
                        { to: "/admin/tests", label: "Assessments", icon: "⚖️" },
                    ].map((item) => (
                        <Link key={item.to} to={item.to}>
                            <Button variant="ghost" className="w-full justify-start h-11 rounded-xl font-bold text-sm hover:bg-muted/50 transition-all">
                                <span className="mr-3 text-lg opacity-80">{item.icon}</span>
                                {item.label}
                            </Button>
                        </Link>
                    ))}

                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mt-8 mb-2 px-3">Support & Settings</p>
                    {[
                        { to: "/admin/settings", label: "Platform Settings", icon: "⚙️" },
                        { to: "/admin/support", label: "Help Tickets", icon: "🆘" },
                    ].map((item) => (
                        <Link key={item.to} to={item.to}>
                            <Button variant="ghost" className="w-full justify-start h-11 rounded-xl font-bold text-sm hover:bg-muted/50 transition-all">
                                <span className="mr-3 text-lg opacity-80">{item.icon}</span>
                                {item.label}
                            </Button>
                        </Link>
                    ))}

                    <div className="mt-auto pt-6 border-t border-border/50">
                        <Link to="/">
                            <Button variant="outline" className="w-full justify-center h-11 rounded-xl font-bold text-xs border-border/50 hover:bg-muted/30">
                                View Live Site
                            </Button>
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white border-b flex items-center px-8 justify-between sticky top-0 z-20 shadow-sm shadow-black/[0.01]">
                    <div className="flex items-center gap-4">
                        <h1 className="font-extrabold text-lg tracking-tight">Active Terminal</h1>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-foreground">Admin Session</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{currentUser.email}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                            onClick={() => {
                                logoutUser();
                                navigate("/admin/login");
                            }}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Button>
                    </div>
                </header>
                <div className="p-8 flex-1 overflow-auto bg-[#f8fafc]/50">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
