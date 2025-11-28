import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, type Course, type Lesson } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CoursePlayerPage() {
    const params = useParams();
    const navigate = useNavigate();
    const { courses, isInitialized, currentUser } = useStore();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    useEffect(() => {
        if (isInitialized && params.courseId) {
            // Check authentication
            if (!currentUser) {
                navigate("/login");
                return;
            }

            const foundCourse = courses.find((c) => c.id === params.courseId);

            if (foundCourse) {
                // Check enrollment
                const isEnrolled = currentUser.enrolledCourses.includes(foundCourse.id);
                if (!isEnrolled && currentUser.role !== 'admin') {
                    navigate("/"); // Redirect to home if not enrolled
                    return;
                }

                setCourse(foundCourse);
                if (foundCourse.lessons.length > 0) {
                    setActiveLesson(foundCourse.lessons[0]);
                }
            } else {
                navigate("/my-learning");
            }
        }
    }, [isInitialized, params.courseId, courses, navigate, currentUser]);

    if (!isInitialized || !course) {
        return <div className="p-8 text-center">Loading course...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => navigate("/my-learning")}>
                    ← Back to My Learning
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                <p className="text-muted-foreground mt-2">{course.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
                        {activeLesson ? (
                            activeLesson.videoUrl.includes("youtube.com") || activeLesson.videoUrl.includes("youtu.be") ? (
                                <iframe
                                    src={activeLesson.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                    title={activeLesson.title}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={activeLesson.videoUrl}
                                    controls
                                    className="w-full h-full"
                                    poster="/placeholder-video.jpg"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/20">
                                <div className="text-center">
                                    <p className="text-lg font-medium">No Lesson Selected</p>
                                    <p className="text-sm">Select a lesson from the playlist to start watching.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {activeLesson && (
                        <div className="p-4 rounded-lg bg-card border shadow-sm">
                            <h2 className="text-xl font-semibold">{activeLesson.title}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Duration: {activeLesson.duration}</p>
                        </div>
                    )}
                </div>

                {/* Playlist Section */}
                <div className="lg:col-span-1">
                    <Card className="h-full max-h-[600px] flex flex-col">
                        <div className="p-4 border-b bg-muted/30">
                            <h3 className="font-semibold">Course Content</h3>
                            <p className="text-xs text-muted-foreground mt-1">{course.lessons.length} Lessons</p>
                        </div>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            {course.lessons.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No lessons available yet.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {course.lessons.map((lesson, index) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => setActiveLesson(lesson)}
                                            className={cn(
                                                "w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 group",
                                                activeLesson?.id === lesson.id ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0 transition-colors",
                                                activeLesson?.id === lesson.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    activeLesson?.id === lesson.id ? "text-primary" : "text-foreground"
                                                )}>
                                                    {lesson.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration}</p>
                                            </div>
                                            {activeLesson?.id === lesson.id && (
                                                <div className="ml-auto self-center">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
