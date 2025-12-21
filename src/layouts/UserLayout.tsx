import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Home, BookOpen, LayoutDashboard, UserCircle, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function UserLayout() {
    const { currentUser, logoutUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logoutUser();
        navigate("/login");
    };

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
                <div className="container flex h-16 items-center justify-between mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-lg"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <Link to={currentUser ? "/welcome" : "/"} className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
                            <img src="/favicon.png" alt="Logo" className="h-8 w-8 rounded-lg shadow-md transition-transform hover:rotate-3 object-contain bg-primary/10" />
                            <span className="inline">AcademyPro</span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
                        <Link to="/" className={`transition-all ${location.pathname === "/" ? "text-primary" : "text-foreground hover:text-primary"}`}>
                            Home
                        </Link>
                        <Link to="/browse" className={`transition-all ${location.pathname === "/browse" ? "text-primary" : "text-foreground hover:text-primary"}`}>
                            Browse
                        </Link>
                        {currentUser && (
                            <Link to="/my-learning" className={`transition-all ${location.pathname === "/my-learning" ? "text-primary" : "text-foreground hover:text-primary"}`}>
                                Dashboard
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center gap-3">
                        {currentUser ? (
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="hidden lg:flex flex-col items-end mr-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certified Learner</span>
                                    <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                                        {currentUser.name.split(' ')[0]}
                                    </span>
                                </div>
                                <Button size="sm" variant="outline" onClick={handleLogout} className="border-2 font-bold h-9 rounded-xl hidden sm:flex">
                                    Sign Out
                                </Button>
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold md:hidden">
                                    {currentUser.name[0]}
                                </div>
                            </div>
                        ) : (
                            <Link to="/login">
                                <Button size="sm" className="rounded-xl px-5 md:px-6 shadow-lg shadow-primary/20 font-bold h-9 md:h-10">Sign In</Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isMenuOpen && (
                    <div className="md:hidden border-t bg-background animate-in slide-in-from-top duration-300">
                        <nav className="flex flex-col p-4 gap-1">
                            {[
                                { to: "/", label: "Home", icon: Home },
                                { to: "/browse", label: "Browse Catalog", icon: BookOpen },
                                ...(currentUser ? [{ to: "/my-learning", label: "My Learning", icon: LayoutDashboard }] : []),
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center justify-between p-4 rounded-xl font-bold transition-colors ${location.pathname === item.to ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="h-5 w-5 opacity-70" />
                                        <span>{item.label}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 opacity-50" />
                                </Link>
                            ))}

                            {currentUser ? (
                                <div className="mt-4 pt-4 border-t border-border space-y-2">
                                    <div className="flex items-center gap-3 p-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {currentUser.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{currentUser.name}</span>
                                            <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start h-12 rounded-xl text-red-500 font-bold hover:bg-red-50 hover:text-red-600"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-3 h-5 w-5" />
                                        Sign Out
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-4 p-2">
                                    <Link to="/login">
                                        <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Sign In Now</Button>
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                <Outlet />
            </main>
            <footer className="border-t border-border bg-muted py-12">
                <div className="container mx-auto px-4 flex items-center justify-center">
                    <p className="text-center text-sm font-bold leading-loose text-foreground">
                        © AcademyPro. Built with Vite & React.
                    </p>
                </div>
            </footer>
        </div>
    );
}
