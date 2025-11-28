import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
    const navigate = useNavigate();

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
                        <span className="text-sm text-muted-foreground">Admin User</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                document.cookie = "admin_session=; path=/; max-age=0";
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
