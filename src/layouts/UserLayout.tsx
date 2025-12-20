import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function UserLayout() {
    const { currentUser, logoutUser } = useStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate("/login");
    };

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
                <div className="container flex h-16 items-center justify-between mx-auto px-4">
                    <Link to={currentUser ? "/welcome" : "/"} className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 10v6M2 10v6" /><path d="M20 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M15 22a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /><path d="M5 22a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" /></svg>
                        </div>
                        LMS Platform
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
                        <Link to="/" className="text-foreground transition-all hover:text-primary">
                            Home
                        </Link>
                        <Link to="/browse" className="text-foreground transition-all hover:text-primary">
                            Browse
                        </Link>
                        {currentUser && (
                            <Link to="/my-learning" className="text-foreground transition-all hover:text-primary">
                                Dashboard
                            </Link>
                        )}
                        <Link to="#" className="text-foreground transition-all hover:text-primary">
                            Mentors
                        </Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        {currentUser ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-foreground font-bold hidden md:inline-block">
                                    {currentUser.email}
                                </span>
                                <Button size="sm" variant="outline" onClick={handleLogout} className="border-2 font-bold">
                                    Sign Out
                                </Button>
                            </div>
                        ) : (
                            <Link to="/login">
                                <Button size="sm" className="rounded-full px-6 shadow-xl font-bold">Sign In</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                <Outlet />
            </main>
            <footer className="border-t border-border bg-muted py-12">
                <div className="container mx-auto px-4 flex items-center justify-center">
                    <p className="text-center text-sm font-bold leading-loose text-foreground">
                        © LMS Platform. Built with Vite & React.
                    </p>
                </div>
            </footer>
        </div>
    );
}
