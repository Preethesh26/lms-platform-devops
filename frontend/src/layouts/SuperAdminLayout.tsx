// ============================================================
// SUPER ADMIN LAYOUT
// Sidebar + header for all /superadmin/* routes
// Completely separate from AdminLayout — no shared guards
// ============================================================

import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuperAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check super admin session — completely separate from org admin session
    useEffect(() => {
        const token = localStorage.getItem('superadmin_token');
        const user = localStorage.getItem('superadmin_user');
        if (!token || !user) {
            navigate('/superadmin/login');
            return;
        }
        try {
            const parsed = JSON.parse(user);
            if (parsed.role !== 'superadmin') {
                navigate('/superadmin/login');
            }
        } catch {
            navigate('/superadmin/login');
        }
    }, [navigate]);

    const superAdminUser = (() => {
        try { return JSON.parse(localStorage.getItem('superadmin_user') || '{}'); }
        catch { return {}; }
    })();

    const handleLogout = () => {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
        navigate('/superadmin/login');
    };

    const navItems = [
        { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
    ];

    return (
        <div className="h-screen flex bg-slate-950">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Shield className="w-6 h-6 text-primary mr-3" />
                    <div>
                        <p className="text-white font-bold text-sm">Super Admin</p>
                        <p className="text-slate-500 text-xs">Platform Control</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.to} to={item.to}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start h-10 rounded-lg text-sm font-medium ${
                                    location.pathname === item.to
                                        ? 'bg-primary text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                                <item.icon className="mr-3 h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {superAdminUser.name?.[0] || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{superAdminUser.name || 'Super Admin'}</p>
                            <p className="text-slate-500 text-xs">superadmin</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center px-8">
                    <h2 className="text-white font-bold text-sm uppercase tracking-widest">
                        {location.pathname.split('/').pop()?.replace('-', ' ')}
                    </h2>
                </header>
                <div className="flex-1 overflow-auto p-8 bg-slate-950">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
