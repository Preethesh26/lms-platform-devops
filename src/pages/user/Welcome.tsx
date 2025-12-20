import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { LayoutDashboard, Globe, ArrowRight, Sparkles } from "lucide-react";

export default function WelcomePage() {
    const navigate = useNavigate();
    const { currentUser } = useStore();

    if (!currentUser) {
        navigate("/login");
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />

            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Header Section */}
                <div className="md:col-span-2 text-center space-y-4 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                        <Sparkles className="h-4 w-4" />
                        Welcome back, {currentUser.name}!
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                        Where would you like to go?
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Choose your destination to continue your learning journey today.
                    </p>
                </div>

                {/* Option 1: Website */}
                <Card
                    className="group relative overflow-hidden border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-md hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer border-2 hover:border-primary"
                    onClick={() => navigate("/")}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
                    </div>
                    <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                            <Globe className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Browse Website</CardTitle>
                        <CardDescription className="text-base">
                            Explore new courses, categories, and catch up on the latest platform announcements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="ghost" className="p-0 group-hover:text-primary transition-colors flex items-center gap-2">
                            Go to Website <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Option 2: Dashboard */}
                <Card
                    className="group relative overflow-hidden border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-md hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer border-2 hover:border-purple-500"
                    onClick={() => navigate("/my-learning")}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutDashboard className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
                    </div>
                    <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2 group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Student Dashboard</CardTitle>
                        <CardDescription className="text-base">
                            Resume your learning, track your progress, and view your enrolled courses and achievements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="ghost" className="p-0 group-hover:text-purple-500 transition-colors flex items-center gap-2">
                            Go to Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
