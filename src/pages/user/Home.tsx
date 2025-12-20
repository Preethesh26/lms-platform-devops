import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, type Course } from "@/lib/store";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { settingsAPI } from "@/lib/api";
import { TakeTestDialog } from "@/components/user/TakeTestDialog";
import {
    ArrowRight,
    Keyboard,
    Layout,
    Cpu,
    Palette,
    Shield,
    BookOpen,
    Clock,
    Users,
    ChevronRight,
    Star,
    LineChart,
    Briefcase,
    Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UserHomePage() {
    const { courses, isInitialized, currentUser, enrollUser } = useStore();
    const navigate = useNavigate();
    const [showTakeTest, setShowTakeTest] = useState(false);

    useEffect(() => {
        checkSettings();
    }, []);

    const checkSettings = async () => {
        try {
            const res = await settingsAPI.getAll();
            setShowTakeTest(res.data.data.showTakeTestButton);
        } catch (error) {
            console.error('Failed to fetch settings');
        }
    };

    const handleEnroll = (courseId: string) => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        enrollUser(currentUser.id, courseId);
        navigate(`/courses/${courseId}`);
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-32 pb-24">
            {/* --- HERO SECTION --- */}
            <section className="relative px-4 pt-8">
                <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 px-6 py-20 text-center shadow-2xl shadow-primary/20 sm:px-12 sm:py-32 relative">
                    {/* Decorative Background Circles */}
                    <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"></div>

                    <div className="relative z-10 mx-auto max-w-4xl space-y-10">
                        <div className="flex justify-center space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-semibold text-white border border-white/20 shadow-lg">
                                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                                Trusted by 12,000+ Students Worldwide
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-tight">
                                Unlock Your Potential with <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">Master-Level Training</span>
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg text-indigo-50 sm:text-xl leading-relaxed">
                                Access industry-leading courses, expert instructors, and a global community.
                                Master new skills and accelerate your career today.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                            <Link to="/browse">
                                <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl transition-all hover:-translate-y-1">
                                    Explore Courses
                                </Button>
                            </Link>

                            {showTakeTest && (
                                <TakeTestDialog>
                                    <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm transition-all shadow-lg">
                                        <Keyboard className="mr-2 h-5 w-5" />
                                        Take a Test
                                    </Button>
                                </TakeTestDialog>
                            )}
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10 mt-12 bg-black/10 backdrop-blur-sm rounded-3xl p-6">
                            <div>
                                <p className="text-3xl font-bold text-white">100+</p>
                                <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest opacity-80 mt-1">Courses</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">50+</p>
                                <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest opacity-80 mt-1">Mentors</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">10k+</p>
                                <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest opacity-80 mt-1">Learners</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CATEGORIES SECTION --- */}
            <section className="max-w-7xl mx-auto px-6 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">Future-Proof Your Career</h2>
                        <p className="text-muted-foreground max-w-2xl text-lg">Explore our most popular categories and start your learning journey with top-tier content.</p>
                    </div>
                    <Link to="/browse">
                        <Button variant="ghost" className="text-primary hover:text-primary/10 hover:bg-primary/5 font-bold text-lg p-0 h-auto group">
                            View All Categories <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: "Web Systems", icon: <Layout />, count: "24 Courses", color: "text-blue-600", bg: "bg-blue-50" },
                        { name: "AI & ML", icon: <Cpu />, count: "18 Courses", color: "text-purple-600", bg: "bg-purple-50" },
                        { name: "Visual Arts", icon: <Palette />, count: "15 Courses", color: "text-pink-600", bg: "bg-pink-50" },
                        { name: "Cyber Ops", icon: <Shield />, count: "12 Courses", color: "text-red-600", bg: "bg-red-50" },
                    ].map((cat) => (
                        <Card key={cat.name} className="group border-none bg-muted/50 hover:bg-card transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden p-2">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className={`w-16 h-16 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm`}>
                                    {cat.icon}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xl">{cat.name}</h3>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{cat.count}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* --- FEATURED COURSES --- */}
            <section className="space-y-12 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
                    <Badge variant="outline" className="border-primary/30 text-primary font-semibold px-4 py-1 rounded-full uppercase tracking-widest text-[10px] bg-primary/5">New & Notable</Badge>
                    <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Our Featured Masterclasses</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Hand-picked courses from industry experts to help you reach your goals faster.</p>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.slice(0, 3).map((course: Course) => {
                        const isEnrolled = currentUser?.enrolledCourses.includes(course.id);
                        return (
                            <Card key={course.id} className="group flex flex-col border-border/50 bg-card transition-all hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden rounded-3xl">
                                <div className="aspect-video relative overflow-hidden">
                                    <div className={`absolute inset-0 ${course.color || "bg-primary"} opacity-20`}></div>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 group-hover:bg-black/30 transition-colors">
                                        <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/30">
                                            <BookOpen className="h-8 w-8" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-white/90 backdrop-blur-sm text-primary border-none font-bold shadow-sm">Featured</Badge>
                                    </div>
                                </div>

                                <CardHeader className="space-y-3 pt-6">
                                    <CardTitle className="text-2xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                                    <CardDescription className="font-medium text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground pt-4 border-t border-border/50 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> 12h 30m
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" /> 5,200+ Students
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="p-6 pt-0 flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-primary">₹{course.price}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lifetime Access</span>
                                    </div>
                                    {isEnrolled ? (
                                        <Link to={`/courses/${course.id}`}>
                                            <Button size="sm" className="h-11 px-6 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => handleEnroll(course.id)}
                                            className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                                        >
                                            Enroll Now <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="max-w-7xl mx-auto px-6 py-12 rounded-[3rem] bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden relative">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">Elevate Your Learning <br /><span className="text-primary italic font-medium">Experience.</span></h2>
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg font-medium">We've built a platform designed specifically for career acceleration and deep skill acquisition.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {[
                                { title: "Expert Mentors", desc: "Learn from top-tier industry veterans.", icon: <Star className="h-5 w-5" />, bg: "bg-blue-100 text-blue-600" },
                                { title: "Smart Tracking", desc: "Detailed insights into your progress.", icon: <LineChart className="h-5 w-5" />, bg: "bg-purple-100 text-purple-600" },
                                { title: "Career Support", desc: "Resume building and interview prep.", icon: <Briefcase className="h-5 w-5" />, bg: "bg-green-100 text-green-600" },
                                { title: "Certification", desc: "Earn certificates for every course.", icon: <Award className="h-5 w-5" />, bg: "bg-red-100 text-red-600" },
                            ].map((f) => (
                                <div key={f.title} className="space-y-3 group">
                                    <div className={`h-11 w-11 rounded-xl ${f.bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                        {f.icon}
                                    </div>
                                    <h3 className="font-bold text-lg">{f.title}</h3>
                                    <p className="font-medium text-muted-foreground text-sm leading-snug">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all">Start Your Journey</Button>
                    </div>

                    <div className="relative">
                        <div className="aspect-square bg-gradient-to-tr from-indigo-200 to-purple-200 dark:from-indigo-900 dark:to-purple-900 rounded-[3rem] p-8 shadow-inner overflow-hidden flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="space-y-4 pt-12">
                                    <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-xl -rotate-2">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl mb-4">🚀</div>
                                        <p className="font-bold text-sm tracking-tight leading-tight">Fast-track to mastery in any field.</p>
                                    </div>
                                    <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-xl rotate-1 translate-x-2">
                                        <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl mb-4">📈</div>
                                        <p className="font-bold text-sm tracking-tight leading-tight">+98% Successful Student Outcome.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-xl rotate-2">
                                        <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl mb-4">⭐</div>
                                        <p className="font-bold text-sm tracking-tight leading-tight">Top-rated content by developers.</p>
                                    </div>
                                    <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-xl -rotate-1 -translate-x-2">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl mb-4">🤝</div>
                                        <p className="font-bold text-sm tracking-tight leading-tight">Join a global learning community.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section className="max-w-7xl mx-auto px-6 py-20 bg-muted/30 rounded-[3rem] border border-border/50">
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Voices of Success</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">Hear from our students who transformed their careers through our platform.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "Sarah Johnson", role: "Senior Developer", text: "Truly the best investment I've made in years. The quality of instructors is second to none.", avatar: "SJ" },
                            { name: "Mark Peterson", role: "UX Designer", text: "The project-based learning approach actually gives you skills you can use immediately.", avatar: "MP" },
                            { name: "Elisa Vance", role: "Data Scientist", text: "From zero to pro in months. The community support kept me going through tough weeks.", avatar: "EV" },
                        ].map((t, i) => (
                            <Card key={i} className="bg-card border-none shadow-lg hover:shadow-2xl transition-all cursor-default p-8 rounded-3xl group">
                                <CardContent className="p-0 space-y-6">
                                    <div className="flex gap-1 text-yellow-400">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed italic text-foreground tracking-tight">"{t.text}"</p>
                                    <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">{t.avatar}</div>
                                        <div>
                                            <p className="font-bold text-foreground leading-tight">{t.name}</p>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="max-w-6xl mx-auto px-4 pb-24">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[3rem] p-12 md:p-24 text-center space-y-10 shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-white/5 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl translate-x-1/2 translate-y-1/2"></div>

                    <div className="space-y-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                            Ready to Transform <br /> Your Career?
                        </h2>
                        <p className="text-indigo-50 text-xl font-medium max-w-2xl mx-auto">
                            Join thousands of students and start learning today. No commitment, no credit card required to start.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10 pt-4">
                        <Link to="/signup">
                            <Button size="lg" className="h-16 px-12 text-xl font-bold rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-2xl transition-all hover:scale-105">
                                Join for Free
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
