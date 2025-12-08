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
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/40 hidden md:block">
                <div className="flex h-16 items-center border-b px-6">
                    <Link to="/admin" className="font-bold text-xl">
                        LMS Admin
                    </Link>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                    <Link to="/admin/dashboard">
                        <Button variant="ghost" className="w-full justify-start">
                            Dashboard
                        </Button>
                    </Link>
                    <Link to="/admin/courses">
                        <Button variant="ghost" className="w-full justify-start">
                            Courses
                        </Button>
                    </Link>
                    <Link to="/admin/users">
                        <Button variant="ghost" className="w-full justify-start">
                            Users
                        </Button>
                    </Link>
                    <div className="mt-auto pt-4 border-t">
                        <Link to="/">
                            <Button variant="outline" className="w-full justify-start">
                                Back to Site
                            </Button>
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b flex items-center px-6 justify-between">
                    <h1 className="font-semibold text-lg">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {currentUser.email}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                logoutUser();
                                navigate("/admin/login");
                            }}
                        >
                            Sign Out
                        </Button>
                    </div>
                </header>
                <div className="p-6 flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
