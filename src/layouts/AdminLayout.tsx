import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, Menu, X, Monitor, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logoutUser, isInitialized } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

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
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-sm md:z-auto flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex h-20 items-center px-8 border-b md:border-none">
                    <Link to="/admin" className="flex items-center gap-3 group">
                        <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 object-contain bg-white" />
                        <span className="font-extrabold text-xl tracking-tight">PrimeSphere Admin</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto md:hidden rounded-lg"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex flex-col gap-1.5 p-6 flex-1 overflow-y-auto">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 px-3">Management</p>
                    {[
                        { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
                        { to: "/admin/courses", label: "Course Catalog", icon: "📚" },
                        { to: "/admin/users", label: "Student Registry", icon: "👥" },
                        { to: "/admin/quizzes", label: "Quizzes", icon: "📝" },
                        { to: "/admin/tests", label: "Assessments", icon: "⚖️" },
                    ].map((item) => (
                        <Link key={item.to} to={item.to}>
                            <Button
                                variant={location.pathname === item.to ? "secondary" : "ghost"}
                                className={`w-full justify-start h-11 rounded-xl font-bold text-sm transition-all ${location.pathname === item.to ? 'bg-primary/5 text-primary' : 'hover:bg-muted/50'}`}
                            >
                                <span className="mr-3 text-lg opacity-80">{item.icon}</span>
                                {item.label}
                                {location.pathname === item.to && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                            </Button>
                        </Link>
                    ))}

                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mt-8 mb-2 px-3">Support & Settings</p>
                    {[
                        { to: "/admin/settings", label: "Platform Settings", icon: "⚙️" },
                        { to: "/admin/support", label: "Help Tickets", icon: "🆘" },
                    ].map((item) => (
                        <Link key={item.to} to={item.to}>
                            <Button
                                variant={location.pathname === item.to ? "secondary" : "ghost"}
                                className={`w-full justify-start h-11 rounded-xl font-bold text-sm transition-all ${location.pathname === item.to ? 'bg-primary/5 text-primary' : 'hover:bg-muted/50'}`}
                            >
                                <span className="mr-3 text-lg opacity-80">{item.icon}</span>
                                {item.label}
                                {location.pathname === item.to && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                            </Button>
                        </Link>
                    ))}

                    <div className="mt-auto pt-6 border-t border-border/50">
                        <Link to="/">
                            <Button variant="outline" className="w-full justify-center h-11 rounded-xl font-bold text-xs border-border/50 hover:bg-muted/30 gap-2">
                                <Monitor className="h-3.5 w-3.5" />
                                View Live Site
                            </Button>
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white border-b flex items-center px-4 md:px-8 justify-between sticky top-0 z-20 shadow-sm shadow-black/[0.01]">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-lg hover:bg-muted"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                            <h1 className="font-extrabold text-sm md:text-lg tracking-tight">Active Terminal</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest md:hidden">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-bold text-foreground font-mono">ADMIN_PRV</span>
                            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{currentUser.email}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-muted/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                            onClick={() => {
                                logoutUser();
                                navigate("/admin/login");
                            }}
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Button>
                    </div>
                </header>
                <div className="p-4 md:p-8 flex-1 overflow-auto bg-[#f8fafc]/50">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
