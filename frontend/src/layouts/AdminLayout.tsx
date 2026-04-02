import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, Menu, X, Monitor, ChevronRight, LayoutDashboard, Database, GraduationCap, PenTool, Settings as SettingsIcon, MessageSquare, LogOut, UserSearch } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InactivityLock } from "@/components/admin/InactivityLock";

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logoutUser, isInitialized, isDemoMode } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const currentPrefix = isDemoMode ? '/demo' : '/admin';

    // Redirection Logic: Ensure user is on the correct prefix
    useEffect(() => {
        if (!isInitialized) return;
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'org_superadmin';
        if (!currentUser || !isAdmin) return;

        const path = location.pathname;
        if (isDemoMode && path.startsWith('/admin/')) {
            navigate(path.replace('/admin/', '/demo/'));
        } else if (!isDemoMode && path.startsWith('/demo/')) {
            navigate(path.replace('/demo/', '/admin/'));
        }
    }, [location.pathname, isDemoMode, navigate, isInitialized, currentUser]);

    useEffect(() => {
        if (isInitialized) {
            const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'org_superadmin';
            if (!currentUser || !isAdmin) {
                const isDemoPath = location.pathname.startsWith('/demo/');
                navigate(isDemoPath ? "/demo/login" : "/admin/login");
            }
        }
    }, [currentUser, isInitialized, navigate, location.pathname]);

    if (!isInitialized) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Initializing AcademyPro...</p>
            </div>
        </div>
    );

    // If not admin/superadmin (and waiting for redirect), don't render content
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'org_superadmin';
    if (!currentUser || !isAdmin) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
    );

    const navItems = [
        { to: `${currentPrefix}/dashboard`, label: "Dashboard", icon: LayoutDashboard, category: "Analytics" },
        { to: `${currentPrefix}/courses`, label: "Courses", icon: Database, category: "Management" },
        { to: `${currentPrefix}/users`, label: "Students", icon: GraduationCap, category: "Management" },
        { to: `${currentPrefix}/quizzes`, label: "Quizzes", icon: PenTool, category: "Management" },
        { to: `${currentPrefix}/tests`, label: "Tests", icon: ClipboardList, category: "Management" },
        { to: `${currentPrefix}/support`, label: "Help Tickets", icon: MessageSquare, category: "Support" },
        { to: `${currentPrefix}/settings`, label: "Settings", icon: SettingsIcon, category: "System" },
        // Org Super Admin can manage admins under their org — separate page
        ...(currentUser?.role === 'org_superadmin' ? [
            { to: `${currentPrefix}/admins`, label: "Manage Admins", icon: UserSearch, category: "System" }
        ] : []),
        // Platform superadmin and regular admin see account resolver
        ...(currentUser?.role === 'admin' || currentUser?.role === 'superadmin' ? [
            { to: `${currentPrefix}/account-resolver`, label: "Account Resolver", icon: UserSearch, category: "System" }
        ] : []),
    ];

    return (
        <div className="h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
            <InactivityLock />
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 dark:bg-slate-900 text-white shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none md:z-auto flex flex-col h-screen md:h-full
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex h-20 items-center px-8">
                    <Link to="/admin" className="flex items-center gap-3 group">
                        <div className="relative">
                            <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-2xl shadow-2xl transition-transform group-hover:scale-110 object-contain bg-white p-1.5" />
                            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl tracking-tighter leading-none text-gradient">AcademyPro</span>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-extrabold">Executive Terminal</span>
                        </div>
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
                <nav className="flex flex-col gap-8 p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {["Analytics", "Management", "Support", "System"].map((category) => (
                        <div key={category} className="space-y-2">
                            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 px-3">{category}</p>
                            <div className="space-y-1">
                                {navItems.filter(item => item.category === category).map((item) => (
                                    <Link key={item.to} to={item.to}>
                                        <Button
                                            variant="ghost"
                                            className={`w-full justify-start h-11 rounded-xl font-bold text-sm transition-all group ${location.pathname === item.to
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon className={`mr-3 h-4 w-4 transition-colors ${location.pathname === item.to ? 'text-white' : 'group-hover:text-primary'
                                                }`} />
                                            {item.label}
                                            {location.pathname === item.to && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                </nav>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <div className="space-y-4">
                        <Link to="/">
                            <Button variant="ghost" className="w-full justify-start h-11 rounded-xl font-bold text-xs text-slate-400 hover:bg-white/5 gap-3">
                                <Monitor className="h-4 w-4" />
                                Launch Live Site
                            </Button>
                        </Link>
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs uppercase">
                                    {currentUser.name?.[0] || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate">{currentUser.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                        {currentUser.role === 'superadmin' ? 'Platform Admin' :
                                         currentUser.role === 'org_superadmin' ? 'Organization Admin' :
                                         currentUser.role === 'admin' ? 'Staff Admin' :
                                         currentUser.role}
                                    </p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                    onClick={() => {
                                        logoutUser();
                                        navigate("/admin/login");
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl border-b dark:border-white/5 flex items-center px-4 md:px-10 justify-between sticky top-0 z-20 transition-all">
                    <div className="flex items-center gap-3 md:gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest hidden md:block">Navigation</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground hidden md:block" />
                            <h2 className="font-extrabold text-xs md:text-sm tracking-tight uppercase">
                                {location.pathname.split('/').pop()?.replace('-', ' ')}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        {isDemoMode && (
                            <div className="hidden lg:flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl border border-amber-500/20 shadow-sm animate-pulse">
                                <Monitor className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Read-Only Demo Terminal</span>
                            </div>
                        )}
                        <div className="hidden sm:flex items-center gap-2 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/50">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Server Live</span>
                        </div>
                        <div className="h-8 w-[1px] bg-border dark:bg-slate-800 mx-1 hidden sm:block"></div>
                        <ThemeToggle />
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                            <span className="font-black text-xs text-primary uppercase">{currentUser.name?.[0] || 'A'}</span>
                        </div>
                    </div>
                </header>
                {isDemoMode && (
                    <div className="bg-amber-500 text-white px-8 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg relative z-10">
                        ⚠️ Preview Environment: Changes will not be saved to protect live data.
                    </div>
                )}
                <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 scroll-smooth">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
