import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Link } from "react-router-dom";
import {
    BookOpen,
    Trophy,
    Clock,
    CirclePlay,
    TrendingUp,
    Sparkles,
    ArrowRight,
    Search
} from "lucide-react";
import { progressAPI } from "@/lib/api";
import { useEffect, useState } from "react";

export default function MyLearningPage() {
    const { courses, isInitialized, currentUser } = useStore();
    const [allProgress, setAllProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchProgress();
        }
    }, [currentUser]);

    const fetchProgress = async () => {
        try {
            const res = await progressAPI.getAllProgress();
            setAllProgress(res.data.data);
        } catch (error) {
            console.error("Failed to fetch all progress:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isInitialized || (currentUser && loading)) return null;

    if (!currentUser) {
        return (
            <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CirclePlay className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Please log in</h2>
                <p className="text-muted-foreground max-w-sm">You need to be logged in to access your personalized dashboard and learning materials.</p>
                <Link to="/login">
                    <Button size="lg" className="rounded-full px-8">Sign In to Continue</Button>
                </Link>
            </div>
        );
    }

    const enrolledCourses = courses.filter(course => currentUser.enrolledCourses.includes(course.id));
    const newCourses = courses.filter(course => !currentUser.enrolledCourses.includes(course.id)).slice(0, 3);

    // Calculate progress for each course
    const calculateCourseProgress = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (!course || course.lessons.length === 0) return 0;

        const completedLessons = allProgress.filter(p => p.course === courseId && p.completed).length;
        return Math.min(Math.round((completedLessons / course.lessons.length) * 100), 100);
    };

    const overallProgress = enrolledCourses.length > 0
        ? Math.round(enrolledCourses.reduce((acc, c) => acc + calculateCourseProgress(c.id), 0) / enrolledCourses.length)
        : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-6">
            {/* Premium Hero Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 md:p-14 text-white shadow-2xl shadow-indigo-500/20">
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl opacity-50"></div>
                <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl opacity-50"></div>

                <div className="relative z-10 space-y-8 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span>Master Level 4 • 1,250 XP • 🚀 4 Day Streak</span>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                            Hi, {currentUser.name}!
                        </h1>
                        <p className="text-indigo-50 text-lg md:text-xl font-medium leading-relaxed">
                            Your potential is limitless. You've conquered <span className="text-yellow-200 font-bold">{overallProgress}%</span> of your courses. Ready for the next challenge?
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link to={enrolledCourses.length > 0 ? `/courses/${enrolledCourses[0].id}` : "/"}>
                            <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl transition-all hover:-translate-y-1">
                                Resume Learning
                            </Button>
                        </Link>

                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Active Courses", value: enrolledCourses.length, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { label: "Hours Learned", value: "24.5", icon: Clock, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
                    { label: "Completion Rate", value: `${overallProgress}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
                    { label: "Certificates", value: "2", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className="border border-border/50 dark:border-border/30 bg-muted/50 hover:bg-card transition-all hover:shadow-xl hover:-translate-y-1 group p-2 rounded-[2rem]">
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-extrabold tracking-tight">{stat.value}</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Sections */}
            <div className="grid lg:grid-cols-4 gap-12">
                {/* Enrolled Courses */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            My Active Courses
                            <span className="text-sm font-medium bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{enrolledCourses.length}</span>
                        </h2>
                        <Button variant="ghost" size="sm" className="font-bold">View All</Button>
                    </div>

                    {enrolledCourses.length === 0 ? (
                        <Card className="border-dashed border-2 bg-transparent">
                            <CardContent className="py-12 text-center space-y-4">
                                <div className="p-4 rounded-full bg-muted w-fit mx-auto">
                                    <Search className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold">No active courses yet</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">Discover something new today and start your professional journey.</p>
                                <Link to="/">
                                    <Button className="rounded-full">Browse Popular Courses</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2">
                            {enrolledCourses.map((course) => (
                                <Card key={course.id} className="group relative border-none bg-background shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ring-1 ring-border">
                                    <div className="h-40 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-black/60 z-10 group-hover:bg-black/40 transition-colors" />
                                        <img
                                            src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop`}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute bottom-4 left-4 z-20">
                                            <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
                                                Active Now
                                            </span>
                                        </div>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xl font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                            {course.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                <span>Progress</span>
                                                <span className="text-primary">{calculateCourseProgress(course.id)}%</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-primary h-full rounded-full shadow-lg transition-all duration-500"
                                                    style={{ width: `${calculateCourseProgress(course.id)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" /> 12 Lessons
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> 4.5h left
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 pb-6 pr-6 flex justify-end">
                                        <Link to={`/courses/${course.id}`} className="w-full">
                                            <Button className="w-full rounded-xl group-hover:translate-y-[-2px] transition-transform shadow-lg shadow-primary/20 font-bold">
                                                Continue Learning
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Explore Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black tracking-tight">Discover</h2>
                        <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">New on the Platform</p>
                        {newCourses.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic px-1">Check back later for new arrivals.</p>
                        ) : (
                            newCourses.map((course) => (
                                <Link to="/" key={course.id} className="block group">
                                    <Card className="border border-border/50 dark:border-border/30 bg-muted hover:bg-muted-foreground/10 transition-all duration-300 overflow-hidden">
                                        <CardContent className="p-4 flex gap-4">
                                            <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-border">
                                                <img
                                                    src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop`}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                                                />
                                            </div>
                                            <div className="space-y-1 py-1">
                                                <h4 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                    {course.title}
                                                </h4>
                                                <div className="flex items-center text-[10px] font-black tracking-widest uppercase text-muted-foreground group-hover:text-primary transition-colors">
                                                    Explore Now <ArrowRight className="ml-1 h-2 w-2" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                        <Link to="/">
                            <Button variant="outline" className="w-full rounded-xl mt-4 font-bold border-dashed hover:border-solid transition-all">
                                View Marketplace
                            </Button>
                        </Link>
                    </div>

                    {/* Achievement Preview */}
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-amber-600 p-6 space-y-4 shadow-xl">
                        <div className="h-10 w-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-lg">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-white">Daily Streak</h3>
                            <p className="text-xs text-white/90 font-bold">Learn 15 more mins to keep your 4-day streak alive!</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map(day => (
                                <div key={day} className="h-6 w-6 rounded-md bg-white flex items-center justify-center text-[10px] font-bold text-amber-600 shadow-md">
                                    {day}
                                </div>
                            ))}
                            <div className="h-6 w-6 rounded-md border-2 border-dashed border-white/50" />
                            <div className="h-6 w-6 rounded-md border-2 border-dashed border-white/20" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
