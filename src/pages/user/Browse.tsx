import { useState, useMemo } from "react";
import { useStore, type Course } from "@/lib/store";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Filter,
    BookOpen,
    Clock,
    GraduationCap,
    ArrowRight,
    SearchX,
    LayoutGrid,
    ChevronRight,
    Star,
    Users,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BrowsePage() {
    const { courses, isInitialized, currentUser, enrollUser } = useStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = [
        "All",
        "Web Development",
        "UI/UX Design",
        "Data Science",
        "Mobile Dev",
        "Cloud Computing",
        "Cyber Security"
    ];

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(searchQuery.toLowerCase());

            // Since Course doesn't have a category field yet, we'll just show all for now 
            // but keep the filter logic ready for when it's added.
            // For now, we'll just mock it or skip filter if not 'All'
            if (selectedCategory === "All") return matchesSearch;

            // Temporary: Mock category matching based on title keywords
            const categoryKeywords: Record<string, string[]> = {
                "Web Development": ["web", "react", "html", "javascript", "developer", "backend", "frontend"],
                "UI/UX Design": ["design", "ui", "ux", "figma"],
                "Data Science": ["data", "python", "ai", "machine", "ml"],
                "Mobile Dev": ["mobile", "app", "react native", "ios", "android"],
                "Cloud Computing": ["cloud", "aws", "azure", "devops"],
                "Cyber Security": ["security", "hack", "cyber"]
            };

            const keywords = categoryKeywords[selectedCategory] || [];
            const matchesCategory = keywords.some(keyword =>
                course.title.toLowerCase().includes(keyword) ||
                course.description.toLowerCase().includes(keyword)
            );

            return matchesSearch && matchesCategory;
        });
    }, [courses, searchQuery, selectedCategory]);

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
        <div className="min-h-screen bg-background pb-20">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 pt-8 pb-32 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-1/2 -left-12 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl"></div>

                <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-0">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/10 mb-6 md:mb-8 p-0 h-auto font-bold flex items-center gap-2 group transition-all"
                    >
                        <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm md:text-base">Back</span>
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                        <div className="space-y-4 md:space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-[10px] md:text-sm font-bold text-white border border-white/20 uppercase tracking-widest">
                                <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span>Discover New Skills</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                                Learning That <br className="hidden sm:block" /> <span className="text-yellow-200">Moves You.</span>
                            </h1>
                            <p className="text-indigo-50 font-medium text-base md:text-lg max-w-xl leading-relaxed opacity-90">
                                Join our global community of learners and transform your career with expert-led courses across every industry.
                            </p>
                        </div>

                        <div className="w-full md:w-[450px]">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input
                                    className="pl-14 h-16 bg-white border-none text-foreground font-medium rounded-3xl shadow-2xl focus:ring-4 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-lg transition-all"
                                    placeholder="Search for courses, skills..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-10 relative z-20">
                {/* Category Filters - Horizontally Scrollable on Mobile */}
                <div className="flex bg-card border border-border/50 rounded-[2rem] shadow-xl mb-8 md:mb-12 items-center overflow-x-auto no-scrollbar p-2">
                    <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap md:justify-start px-2 py-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 md:px-7 md:py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                    : "bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count & Sort */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6 px-2">
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-3">
                        <LayoutGrid className="h-5 w-5 md:h-6 md:w-6 text-primary/70" />
                        <span>Showing {filteredCourses.length} Courses</span>
                    </h2>
                    <div className="flex items-center gap-3 text-[10px] md:text-sm font-bold text-muted-foreground bg-muted/50 px-4 py-2.5 rounded-xl border border-border/10 w-full sm:w-auto overflow-hidden">
                        <Filter className="h-4 w-4 shrink-0" />
                        <span className="shrink-0 uppercase tracking-widest">Sort:</span>
                        <select className="bg-transparent border-none text-foreground font-extrabold focus:ring-0 cursor-pointer p-0 pr-6 text-xs md:text-sm w-full sm:w-auto">
                            <option>Most Recent</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Popularity</option>
                        </select>
                    </div>
                </div>

                {/* Course Grid */}
                {filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course: Course) => {
                            const isEnrolled = currentUser?.enrolledCourses.includes(course.id);
                            return (
                                <Card key={course.id} className="group overflow-hidden border-border/50 bg-card transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col rounded-[2rem]">
                                    <div className="relative aspect-video overflow-hidden">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className={`absolute inset-0 ${course.color || "bg-primary"} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/30 group-hover:bg-black/20 transition-colors">
                                            {!course.thumbnail && (
                                                <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/30">
                                                    <BookOpen className="h-7 w-7" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-white/90 backdrop-blur-sm text-primary border-none font-bold shadow-sm">Popular</Badge>
                                        </div>
                                    </div>

                                    <CardHeader className="space-y-3 pt-6 px-6">
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-current" />)}
                                            <span className="text-[10px] font-bold text-muted-foreground ml-1">(4.9)</span>
                                        </div>
                                        <CardTitle className="font-extrabold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 font-medium text-muted-foreground text-sm leading-relaxed">
                                            {course.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="px-6 flex-1">
                                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-4 border-t border-border/50 uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>12h 30m</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5" />
                                                <span>Global</span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex items-center justify-between p-6 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground line-through opacity-60">₹{(course.price * 1.5).toFixed(0)}</span>
                                            <span className="text-2xl font-bold text-primary">₹{course.price}</span>
                                        </div>

                                        {isEnrolled ? (
                                            <Button
                                                onClick={() => navigate(`/courses/${course.id}`)}
                                                className="rounded-xl px-6 font-bold shadow-lg shadow-green-500/10 transition-all hover:scale-105 bg-green-500 hover:bg-green-600 h-11"
                                            >
                                                Start <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleEnroll(course.id)}
                                                className="rounded-xl px-6 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-105 h-11"
                                            >
                                                Enroll <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-muted/40 rounded-[3rem] border-2 border-dashed border-border/60 text-center space-y-6">
                        <div className="h-24 w-24 bg-background rounded-full flex items-center justify-center border border-border shadow-xl">
                            <SearchX className="h-10 w-10 text-muted-foreground opacity-40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-extrabold tracking-tight">No Courses Found</h3>
                            <p className="text-muted-foreground font-medium max-w-md mx-auto">
                                We couldn't find any courses matching your request. Try broadening your keywords or clearing the filters.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-2xl px-8 font-bold border-2"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("All");
                            }}
                        >
                            Reset Catalog
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
