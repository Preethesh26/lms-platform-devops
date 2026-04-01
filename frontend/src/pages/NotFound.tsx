import { Button } from "@/components/ui/button";
import { Ghost, Home, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
            <div className="relative mb-8">
                <div className="absolute -inset-4 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>
                <div className="relative flex items-center justify-center">
                    <span className="text-9xl font-extrabold text-muted-foreground/20 select-none">404</span>
                    <Ghost className="absolute h-24 w-24 text-primary animate-bounce duration-3000" />
                </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Page Not Found
            </h1>

            <p className="max-w-[600px] text-muted-foreground text-lg mb-8">
                Whoops! It looks like you've ventured into the unknown.
                The page you are looking for might have been moved, deleted, or possibly never existed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link to="/">
                    <Button size="lg" className="gap-2">
                        <Home className="h-4 w-4" />
                        Go Home
                    </Button>
                </Link>
                <Link to="/contact-admin">
                    <Button size="lg" variant="outline" className="gap-2">
                        <Search className="h-4 w-4" />
                        Report Issue
                    </Button>
                </Link>
            </div>
        </div>
    );
}
