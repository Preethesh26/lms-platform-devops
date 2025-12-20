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
        <div className="space-y-32 pb-24 overflow-x-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative pt-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[600px] bg-primary rounded-b-[100px] -z-10 shadow-2xl border-b-8 border-indigo-200"></div>

                <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
                    <div className="flex justify-center animate-in fade-in slide-in-from-top-10 duration-700">
                        <div className="inline-flex items-center gap-3 bg-indigo-900 px-6 py-2 rounded-full border-2 border-white text-white font-black text-sm tracking-tighter">
                            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></span>
                            NOW JOINING: 12,000+ GLOBAL LEARNERS
                            {showTakeTest && (
                                <span className="bg-yellow-400 text-black px-2 py-0.5 rounded ml-2 scale-90">LIVE TESTS</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9]">
                            LEARN WITHOUT <br />
                            <span className="text-yellow-400 transform -rotate-1 inline-block drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]">LIMITS.</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl md:text-2xl text-white font-black opacity-90 leading-tight">
                            The world's most innovative platform for mastering high-demand skills. Join the top 1% of achievers today.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                        <Link to="/browse">
                            <Button size="lg" className="h-16 px-12 text-xl font-black rounded-2xl bg-white text-primary hover:bg-yellow-400 hover:text-black hover:scale-105 transition-all shadow-[0_10px_0_rgba(0,0,0,0.2)] border-b-4 border-muted">
                                EXPLORE COURSES <ArrowRight className="ml-3 h-6 w-6" />
                            </Button>
                        </Link>
                        {showTakeTest && (
                            <TakeTestDialog>
                                <Button size="lg" variant="outline" className="h-16 px-12 text-xl font-black rounded-2xl border-4 border-white text-white hover:bg-white hover:text-primary transition-all shadow-2xl">
                                    <Keyboard className="mr-3 h-6 w-6" /> CHALLENGE YOURSELF
                                </Button>
                            </TakeTestDialog>
                        )}
                    </div>

                    {/* Trusted Bar */}
                    <div className="pt-16 grid grid-cols-2 md:grid-cols-5 gap-8 items-center text-indigo-300 font-black italic text-xl">
                        <div className="hover:text-white transition-all cursor-default">TECHGIANT</div>
                        <div className="hover:text-white transition-all cursor-default">CLOUDNET</div>
                        <div className="hover:text-white transition-all cursor-default">DEVCORE</div>
                        <div className="hover:text-white transition-all cursor-default">DESIGNLY</div>
                        <div className="hover:text-white transition-all cursor-default">DATAFLOW</div>
                    </div>
                </div>
            </section>

            {/* --- CATEGORIES SECTION --- */}
            <section className="max-w-7xl mx-auto px-6 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-8 border-primary pl-8">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">Future-Proof <br />Your Career</h2>
                        <p className="text-lg font-bold text-muted-foreground max-w-md">Choose from our industry-vetted categories designed for the next decade.</p>
                    </div>
                    <Link to="/browse">
                        <Button variant="outline" className="border-4 border-primary text-primary font-black rounded-xl h-12 px-8 hover:bg-primary hover:text-white transition-all shadow-xl">
                            VIEW ALL CATEGORIES
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: "Web Systems", icon: <Layout />, color: "bg-blue-600", border: "border-blue-800" },
                        { name: "AI & ML", icon: <Cpu />, color: "bg-purple-600", border: "border-purple-800" },
                        { name: "Visual Arts", icon: <Palette />, color: "bg-pink-600", border: "border-pink-800" },
                        { name: "Cyber Ops", icon: <Shield />, color: "bg-red-600", border: "border-red-800" },
                    ].map((cat) => (
                        <Card key={cat.name} className={`group relative overflow-hidden ${cat.color} ${cat.border} border-b-8 border-r-4 transition-all hover:-translate-y-2 hover:translate-x-1 cursor-pointer shadow-2xl`}>
                            <CardContent className="p-10 text-white space-y-6">
                                <div className="h-16 w-16 bg-white flex items-center justify-center rounded-2xl text-primary shadow-xl group-hover:rotate-12 transition-transform">
                                    {cat.icon}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">{cat.name}</h3>
                                    <p className="font-bold opacity-80 text-sm">20+ Premium Courses</p>
                                </div>
                                <ArrowRight className="absolute bottom-6 right-6 h-8 w-8 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* --- FEATURED COURSES --- */}
            <section className="bg-muted py-24 border-y-8 border-primary">
                <div className="max-w-7xl mx-auto px-6 space-y-16">
                    <div className="text-center space-y-4">
                        <Badge className="bg-primary text-white font-black px-6 py-1 mx-auto block w-fit rounded-full uppercase tracking-widest border-2 border-white shadow-lg">New Releases</Badge>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tight uppercase leading-none">The Masterclass <br />Collection</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {courses.slice(0, 3).map((course: Course) => {
                            const isEnrolled = currentUser?.enrolledCourses.includes(course.id);
                            return (
                                <Card key={course.id} className="group flex flex-col border-4 border-black bg-white rounded-3xl overflow-hidden shadow-[12px_12px_0_rgba(0,0,0,1)] hover:shadow-[16px_16px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                                    <div className="aspect-video relative overflow-hidden border-b-4 border-black">
                                        <div className={`absolute inset-0 ${course.color || "bg-primary"}`}></div>
                                        <div className="absolute inset-0 bg-black flex items-center justify-center p-8 bg-black/80">
                                            <div className="text-center space-y-2">
                                                <div className="h-14 w-14 bg-white rounded-xl mx-auto flex items-center justify-center text-primary shadow-2xl">
                                                    <BookOpen className="h-8 w-8" />
                                                </div>
                                                <div className="text-white font-black text-xs uppercase tracking-widest bg-black px-3 py-1 rounded">PLATINUM COURSE</div>
                                            </div>
                                        </div>
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-yellow-400 text-black border-2 border-black font-black uppercase tracking-tighter shadow-md">BESTSELLER</Badge>
                                        </div>
                                    </div>

                                    <CardHeader className="space-y-4 pt-8">
                                        <CardTitle className="text-3xl font-black leading-none line-clamp-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                                        <CardDescription className="font-bold text-foreground line-clamp-2 leading-relaxed opacity-80">{course.description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                                                <Clock className="h-3 w-3" /> 12H+CONTENT
                                            </div>
                                            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                                                <Users className="h-3 w-3" /> 5K STUDENTS
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-8 pt-0 flex flex-col gap-4">
                                        <div className="flex items-center justify-between w-full border-t-2 border-black pt-6">
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-black text-primary">₹{course.price}</span>
                                                <span className="text-xs font-bold text-muted-foreground">LIFETIME ACCESS</span>
                                            </div>
                                            {isEnrolled ? (
                                                <Link to={`/courses/${course.id}`}>
                                                    <Button className="h-14 px-8 rounded-2xl font-black bg-green-600 hover:bg-green-700 text-white border-b-4 border-green-800 shadow-xl transition-all hover:scale-105 uppercase tracking-tighter">CONTINUE <ArrowRight className="ml-2 h-5 w-5" /></Button>
                                                </Link>
                                            ) : (
                                                <Button
                                                    onClick={() => handleEnroll(course.id)}
                                                    className="h-14 px-8 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white border-b-4 border-indigo-800 shadow-xl transition-all hover:scale-105 uppercase tracking-tighter"
                                                >
                                                    ENROLL NOW <ChevronRight className="ml-2 h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                <div className="space-y-10 order-2 md:order-1">
                    <div className="space-y-4">
                        <Badge className="bg-red-600 text-white font-black px-4 py-1 rounded-full border-2 border-red-800 shadow-md">EXCLUSIVE FEATURES</Badge>
                        <h2 className="text-6xl font-black tracking-tight uppercase leading-[0.9]">Why Professionals <br /><span className="text-primary italic">Choose Us.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {[
                            { title: "EXPERT MENTORS", desc: "Learn from veterans working at Top Fortune 500 companies.", icon: <Star />, color: "bg-orange-500" },
                            { title: "SMART TRACKING", desc: "Detailed analytics to track your growth across every skill.", icon: <LineChart />, color: "bg-blue-500" },
                            { title: "CAREER SUPPORT", desc: "Resume building and interview prep included in every course.", icon: <Briefcase />, color: "bg-green-500" },
                            { title: "CERTIFICATION", desc: "Globally recognized certificates upon course completion.", icon: <Award />, color: "bg-purple-500" },
                        ].map((f) => (
                            <div key={f.title} className="space-y-3">
                                <div className={`h-12 w-12 rounded-xl ${f.color} text-white flex items-center justify-center shadow-lg border-b-4 border-black/20`}>
                                    {f.icon}
                                </div>
                                <h3 className="font-black text-xl uppercase tracking-tighter">{f.title}</h3>
                                <p className="font-bold text-muted-foreground text-sm uppercase leading-tight tracking-tighter">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <Button size="lg" className="h-14 px-10 rounded-xl font-black text-lg bg-black text-white hover:scale-105 transition-all shadow-[8px_8px_0_rgba(124,58,237,1)]">GET STARTED FOR FREE</Button>
                </div>

                <div className="relative order-1 md:order-2">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] -z-10"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4 pt-12">
                            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] rotate-3">
                                <span className="text-4xl">🚀</span>
                                <p className="font-black mt-4 text-sm leading-tight uppercase italic">Fastest Track to Mastery</p>
                            </div>
                            <div className="bg-primary text-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] -rotate-3">
                                <span className="text-4xl text-yellow-400 font-black">98%</span>
                                <p className="font-black mt-4 text-sm leading-tight uppercase italic">Student Success Rate</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-yellow-400 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] -rotate-3">
                                <span className="text-4xl">🏆</span>
                                <p className="font-black mt-4 text-sm leading-tight uppercase italic">Award Winning Content</p>
                            </div>
                            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] rotate-3">
                                <span className="text-4xl">🌍</span>
                                <p className="font-black mt-4 text-sm leading-tight uppercase italic">Global Community access</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section className="bg-black py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 space-y-20">
                    <div className="flex items-center justify-between">
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-none">Voices of <br /><span className="text-primary italic">Achievement.</span></h2>
                        <div className="hidden md:flex gap-4">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-16 w-16 rounded-full border-4 border-black bg-muted flex items-center justify-center font-black shadow-xl ring-2 ring-primary">U{i}</div>
                                ))}
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-white font-black text-xl italic leading-none">+12K</span>
                                <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Happy Learners</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "SARAH J.", role: "SENIOR ENGINEER", text: "Truly the best investment I've made in years. The quality of instructors is second to none.", color: "border-primary" },
                            { name: "MARK R.", role: "UX LEAD @ TECH", text: "The project-based learning approach actually gives you skills you can use the next day at work.", color: "border-yellow-400" },
                            { name: "ELISA V.", role: "DATA SCIENTIST", text: "From zero to cloud developer in 6 months. The community support kept me going through tough weeks.", color: "border-pink-500" },
                        ].map((t, i) => (
                            <Card key={i} className={`bg-muted border-l-[12px] ${t.color} border-y-4 border-r-4 border-black rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-default`}>
                                <CardContent className="p-10 space-y-6">
                                    <div className="flex gap-1 text-primary">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                                    </div>
                                    <p className="text-xl font-black italic uppercase leading-tight tracking-tighter">"{t.text}"</p>
                                    <div className="pt-4 border-t-2 border-primary/20">
                                        <p className="font-black text-primary uppercase text-lg">{t.name}</p>
                                        <p className="text-xs font-bold tracking-widest text-muted-foreground">{t.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="max-w-6xl mx-auto px-6 pb-24">
                <div className="bg-primary rounded-[60px] p-12 md:p-24 text-center space-y-12 border-[12px] border-indigo-200 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-indigo-700/50 rounded-full blur-[80px] group-hover:blur-[100px] transition-all"></div>

                    <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] relative z-10">
                        Become the <br /> <span className="text-yellow-400 italic">Unstoppable</span> <br /> version of you.
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10 pt-8">
                        <Link to="/signup">
                            <Button size="lg" className="h-20 px-16 text-2xl font-black rounded-3xl bg-white text-primary hover:bg-yellow-400 hover:text-black hover:scale-110 transition-all shadow-[12px_12px_0_rgba(0,0,0,0.2)] border-b-4 border-muted">
                                JOIN NOW FREE
                            </Button>
                        </Link>
                        <p className="text-white font-black text-xl italic opacity-90 max-w-[200px] text-left leading-none uppercase">
                            NO CREDIT CARD <br /> REQUIRED TO START.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
