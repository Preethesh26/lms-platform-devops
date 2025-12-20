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
    Star
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
        <div className="min-h-screen bg-background pb-20 fade-in">
            {/* Header Section */}
            <div className="bg-primary pt-12 pb-24 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-white text-sm font-black uppercase tracking-widest mb-2 bg-black/40 w-fit px-3 py-1 rounded-full">
                                <BookOpen className="h-4 w-4" />
                                <span>Browse Catalog</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                Find Your Next <span className="underline decoration-yellow-400 decoration-8 underline-offset-8">Skill</span>
                            </h1>
                            <p className="text-white font-black text-lg max-w-xl">
                                Explore hundreds of high-quality courses designed to help you master new technologies and advance your career.
                            </p>
                        </div>

                        <div className="w-full md:w-96">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input
                                    className="pl-12 h-14 bg-white border-4 border-white text-primary font-black rounded-2xl shadow-2xl focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 placeholder:text-primary/40 text-lg transition-all"
                                    placeholder="Search for courses, skills..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-20">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-3 p-4 bg-card border-4 border-border rounded-3xl shadow-2xl mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-3 rounded-xl text-sm font-black transition-all border-2 ${selectedCategory === cat
                                ? "bg-primary text-white border-primary shadow-lg scale-105"
                                : "bg-muted text-foreground border-transparent hover:bg-muted-foreground/10 hover:border-border"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results Count & Sort (Visual only for now) */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                        Showing {filteredCourses.length} Courses
                    </h2>
                    <div className="hidden md:flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        Sort by:
                        <select className="bg-transparent border-none text-foreground font-black focus:ring-0 cursor-pointer">
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
                                <Card key={course.id} className="group overflow-hidden border-4 border-border bg-card transition-all hover:shadow-2xl hover:border-primary hover:-translate-y-2 flex flex-col rounded-3xl">
                                    <div className="relative aspect-video overflow-hidden">
                                        <div className={`absolute inset-0 ${course.color || "bg-primary"} opacity-20 group-hover:opacity-10 transition-opacity`}></div>
                                        <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/60 group-hover:bg-black/40 transition-colors">
                                            <div className="text-center space-y-4">
                                                <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 ${course.color || "bg-primary"}`}>
                                                    <BookOpen className="h-8 w-8" />
                                                </div>
                                                <Badge className="bg-primary text-white font-black px-4 py-1 rounded-full uppercase tracking-tighter">
                                                    {course.lessons.length} Lessons
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <CardHeader className="space-y-4 pt-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-primary uppercase tracking-widest border-2 border-primary px-3 py-1 rounded-full">Best Seller</span>
                                            <div className="flex items-center gap-1 text-yellow-600 font-extrabold text-sm">
                                                <Star className="h-4 w-4 fill-current" />
                                                4.9
                                            </div>
                                        </div>
                                        <CardTitle className="font-black text-2xl line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                            {course.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 font-bold text-foreground text-sm">
                                            {course.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1">
                                        <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground pt-4 border-t-2 border-dashed border-border">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <span>12h 30m</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-primary" />
                                                <span>Level: All</span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex items-center justify-between bg-muted p-6 mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-muted-foreground line-through decoration-red-500 decoration-2">₹{(course.price * 1.5).toFixed(0)}</span>
                                            <span className="text-2xl font-black text-primary">₹{course.price}</span>
                                        </div>

                                        {isEnrolled ? (
                                            <Button
                                                onClick={() => navigate(`/courses/${course.id}`)}
                                                className="rounded-xl px-8 font-black shadow-xl hover:scale-105 transition-transform bg-green-600 hover:bg-green-700 h-12"
                                            >
                                                Start <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleEnroll(course.id)}
                                                className="rounded-xl px-8 font-black shadow-xl hover:scale-105 transition-transform h-12"
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
                    <div className="flex flex-col items-center justify-center py-20 bg-muted rounded-3xl border-4 border-dashed border-border text-center space-y-6">
                        <div className="h-24 w-24 bg-background rounded-full flex items-center justify-center border-4 border-border shadow-2xl animate-bounce">
                            <SearchX className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black">No Courses Found</h3>
                            <p className="text-muted-foreground font-bold max-w-md mx-auto">
                                We couldn't find any courses matching your search or filters. Try adjusting your keywords.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-full px-10 font-black border-2"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("All");
                            }}
                        >
                            Reset All Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
