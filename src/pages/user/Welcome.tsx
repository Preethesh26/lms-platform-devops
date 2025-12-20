import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { progressAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { Sparkles, GraduationCap, LayoutDashboard, ArrowRight, BookOpen } from "lucide-react";

export default function WelcomePage() {
    const navigate = useNavigate();
    const { currentUser, courses } = useStore();
    const [overallProgress, setOverallProgress] = useState<number | null>(null);

    useEffect(() => {
        const fetchProgress = async () => {
            if (currentUser && currentUser.enrolledCourses.length > 0) {
                try {
                    const res = await progressAPI.getAllProgress();
                    const allProgress = res.data.data;

                    const enrolledCourses = courses.filter(c => currentUser.enrolledCourses.includes(c.id));
                    if (enrolledCourses.length === 0) {
                        setOverallProgress(0);
                        return;
                    }

                    const totals = enrolledCourses.reduce((acc, course) => {
                        const completed = allProgress.filter((p: any) => p.course === course.id && p.completed).length;
                        const percentage = course.lessons.length > 0 ? (completed / course.lessons.length) * 100 : 0;
                        return acc + percentage;
                    }, 0);

                    setOverallProgress(Math.round(totals / enrolledCourses.length));
                } catch (error) {
                    console.error("Error fetching welcome progress:", error);
                }
            } else {
                setOverallProgress(0);
            }
        };

        if (currentUser) {
            fetchProgress();
        }
    }, [currentUser, courses]);

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
                <div className="md:col-span-2 text-center space-y-4 mb-2 md:mb-4">
                    <div className="flex flex-col items-center space-y-3 md:space-y-4">
                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white flex items-center justify-center border-[3px] md:border-4 border-primary shadow-xl">
                            <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-primary dark:text-white px-2">
                                Welcome, {currentUser?.name.split(' ')[0]}!
                            </h1>
                            <p className="text-base md:text-xl text-foreground font-bold italic opacity-80 px-4">
                                {overallProgress !== null && overallProgress > 0
                                    ? `You've completed ${overallProgress}% of your courses. Ready to continue?`
                                    : "Your learning journey starts here. Where to today?"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Option 1: Website */}
                <Card
                    className="group relative overflow-hidden border-primary bg-white hover:shadow-2xl hover:shadow-primary transition-all duration-300 cursor-pointer border-2"
                    onClick={() => navigate("/browse")}
                >
                    <div className="absolute top-0 right-0 p-4 group-hover:opacity-100 transition-opacity">
                        <BookOpen className="h-32 w-32 -mr-8 -mt-8 rotate-12 text-primary/20" />
                    </div>
                    <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-6 w-6" />
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
                    className="group relative overflow-hidden border-purple-600 bg-white hover:shadow-2xl hover:shadow-purple-600 transition-all duration-300 cursor-pointer border-2"
                    onClick={() => navigate("/my-learning")}
                >
                    <div className="absolute top-0 right-0 p-4 group-hover:opacity-100 transition-opacity">
                        <LayoutDashboard className="h-32 w-32 -mr-8 -mt-8 rotate-12 text-purple-600/20" />
                    </div>
                    <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
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
