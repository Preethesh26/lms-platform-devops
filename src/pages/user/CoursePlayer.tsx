import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, type Course, type Lesson } from "@/lib/store";
import { progressAPI, certificateAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import ReactPlayer from 'react-player';
import QuizPlayer from "@/components/user/QuizPlayer";
import { AIChatSidebar } from "@/components/user/AIChatSidebar";
import { aiAPI } from "@/lib/api";
import { CheckCircle, PlayCircle, Lock, Award, Download, Bot, Sparkles, FileText, Loader2, ArrowLeft } from "lucide-react";

const ReactPlayerAny = ReactPlayer as any;

type ProgressState = {
    [lessonId: string]: {
        completed: boolean;
        lastPosition: number;
    };
};

export default function CoursePlayerPage() {
    const params = useParams();
    const navigate = useNavigate();
    const { courses, isInitialized, currentUser, createOrder, verifyPayment } = useStore();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [processingStep, setProcessingStep] = useState<'idle' | 'processing' | 'success'>('idle');
    const [progress, setProgress] = useState<ProgressState>({});
    const playerRef = useRef<any>(null); // Type 'any' to avoid LegacyRef mismatch issues
    const progressUpdateTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
    const progressRef = useRef(progress);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [showAISidebar, setShowAISidebar] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [lessonSummary, setLessonSummary] = useState<string | null>(null);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [aiQuizData, setAiQuizData] = useState<any>(null);
    const [aiQuizLoading, setAiQuizLoading] = useState(false);
    const [showAiQuizDialog, setShowAiQuizDialog] = useState(false);

    // Keep progressRef in sync
    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    // Fetch Course & Enrollment Logic
    useEffect(() => {
        if (params.courseId) {
            // ... existing params check logic helper
        }
    }, [params.courseId]); // Keeping this cleaner, actual implementation below

    // Fetch full logic
    useEffect(() => {
        if (isInitialized && params.courseId) {
            // Check authentication
            if (!currentUser) {
                navigate("/login");
                return;
            }

            const foundCourse = courses.find((c) => c.id === params.courseId);

            if (foundCourse) {
                setCourse(foundCourse);

                // Check enrollment
                const enrolled = currentUser.enrolledCourses?.some(id => id && id.toString() === foundCourse.id.toString()) || currentUser.role === 'admin';
                setIsEnrolled(enrolled);

                if (enrolled && foundCourse.lessons.length > 0) {
                    // Set default lesson only if none selected
                    if (!activeLesson) {
                        setActiveLesson(foundCourse.lessons[0]);
                    }

                    // Fetch existing progress
                    fetchProgress(foundCourse.id);
                }
            } else {
                navigate("/my-learning");
            }
        }
    }, [isInitialized, params.courseId, courses, navigate, currentUser]);

    // Fetch Progress from API
    const fetchProgress = async (courseId: string) => {
        try {
            const res = await progressAPI.getCourseProgress(courseId);
            const progressMap: ProgressState = {};

            res.data.data.forEach((p: any) => {
                progressMap[p.lessonId] = {
                    completed: p.completed,
                    lastPosition: p.lastPosition
                };
            });

            setProgress(progressMap);
        } catch (error) {
            console.error("Failed to fetch progress:", error);
        }
    };

    // Helper to get player time safely
    const getPlayerTime = () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            return playerRef.current.getCurrentTime();
        }
        return 0;
    };

    const getPlayerDuration = () => {
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            return playerRef.current.getDuration();
        }
        return 0;
    };

    // Save Progress to API
    const saveProgress = useCallback(async (completedOverride?: boolean, position: number = 0) => {
        if (!course || !activeLesson) return;

        const currentStatus = progressRef.current[activeLesson.id]?.completed || false;
        // If override provided, use it. Else, keep existing status.
        const newCompletedStatus = completedOverride !== undefined ? completedOverride : currentStatus;

        // Optimistic UI Update
        const previousProgress = progressRef.current[activeLesson.id];
        setProgress((prev) => ({
            ...prev,
            [activeLesson.id]: {
                completed: newCompletedStatus,
                lastPosition: position
            }
        }));

        try {
            await progressAPI.update({
                courseId: course.id,
                lessonId: activeLesson.id,
                completed: newCompletedStatus,
                lastPosition: position,
                totalDuration: getPlayerDuration()
            });
        } catch (error) {
            console.error("Failed to save progress:", error);
            // Revert on failure
            setProgress((prev) => ({
                ...prev,
                [activeLesson.id]: previousProgress
            }));
        }
    }, [course, activeLesson]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (progressUpdateTimeout.current) clearTimeout(progressUpdateTimeout.current);
        };
    }, []);

    // Handle Lesson Change
    const handleLessonChange = (lesson: Lesson) => {
        setActiveLesson(lesson);
        setIsVideoReady(false);
        setIsPlaying(false);
        setVideoError(null);
        setLessonSummary(null); // Clear summary when changing lesson
    };

    const handleGenerateSummary = async () => {
        if (!course || !activeLesson || !activeLesson.transcript) return;

        setSummaryLoading(true);
        try {
            const res = await aiAPI.summarize({ courseId: course.id, lessonId: activeLesson.id });
            setLessonSummary(res.data.data);
            setShowSummaryDialog(true);
        } catch (error) {
            console.error("Failed to generate summary:", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleGeneratePracticeQuiz = async () => {
        if (!course || !activeLesson) return;

        setAiQuizLoading(true);
        try {
            const res = await aiAPI.generateQuiz({
                topic: activeLesson.title,
                struggleAreas: "General concepts from this lesson"
            });
            setAiQuizData({
                title: `Practice Quiz: ${activeLesson.title}`,
                questions: res.data.data,
                passingScore: 70
            });
            setShowAiQuizDialog(true);
        } catch (error) {
            console.error("Failed to generate AI quiz:", error);
        } finally {
            setAiQuizLoading(false);
        }
    };

    // Player Events
    const handleProgress = (state: { playedSeconds: number; played: number; loaded: number; loadedSeconds: number }) => {
        // Only save every 5 seconds to reduce API calls
        if (!progressUpdateTimeout.current) {
            progressUpdateTimeout.current = setTimeout(() => {
                // Pass undefined for completed to preserve existing status
                saveProgress(undefined, state.playedSeconds);
                progressUpdateTimeout.current = undefined;
            }, 5000);
        }
    };

    const handleEnded = () => {
        saveProgress(true, getPlayerTime());
    };

    const handleReady = () => {
        setIsVideoReady(true);
        // Seek to saved position if exists and not completed
        if (activeLesson && progress[activeLesson.id]?.lastPosition) {
            const savedTime = progress[activeLesson.id].lastPosition;
            // Don't seek if we are at the very beginning (0-5s) to avoid seeking loops on restart
            if (savedTime > 5) {
                if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                    playerRef.current.seekTo(savedTime, 'seconds');
                }
            }
        }
    };

    const handlePayment = async () => {
        if (!course || !currentUser) return;
        setShowPaymentDialog(true);
        setProcessingStep('idle');
    };

    const processMockPayment = async () => {
        if (!course) return;

        try {
            setProcessingStep('processing');
            setPaymentLoading(true);

            // 1. Create Order (Mock)
            const orderData = await createOrder(course.id);

            // Simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Verify Payment (Mock)
            await verifyPayment({
                transactionId: orderData.order.id
            });

            setProcessingStep('success');

            // Wait to show success checkmark, then redirect to My Learning
            setTimeout(() => {
                setShowPaymentDialog(false);
                setIsEnrolled(true);
                setPaymentLoading(false);

                // Redirect to My Learning page
                navigate("/my-learning");
            }, 2000); // Show success for 2 seconds

        } catch (error) {
            console.error("Payment failed", error);
            setProcessingStep('idle');
            setPaymentLoading(false);
            setShowPaymentDialog(false);
            // Show error in the UI instead of alert
        }
    };

    const handleDownloadCertificate = async () => {
        if (!course) return;
        try {
            const res = await certificateAPI.download(course.id);
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate-${course.title.replace(/\s+/g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download certificate:", error);
            alert("Failed to download certificate. Please ensure all lessons are completed.");
        }
    };

    if (!isInitialized || !course) {
        return <div className="p-8 text-center animate-pulse">Loading course data...</div>;
    }

    // If not enrolled, show Course Details & Payment UI.
    if (!isEnrolled) {
        return (
            <div className="container mx-auto p-4 max-w-6xl py-12 px-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-8 p-0 h-auto font-bold flex items-center gap-2 group hover:bg-transparent"
                >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </div>
                    Back
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">{course.title}</h1>
                            <p className="text-xl text-muted-foreground font-medium leading-relaxed">{course.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-extrabold text-primary">
                                {course.price > 0 ? `₹${course.price}` : "Free"}
                            </div>
                            {course.price > 0 && (
                                <span className="text-sm text-muted-foreground font-medium line-through opacity-60 italic">Standard: ₹{course.price + 1000}</span>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                size="lg"
                                className="h-14 px-10 text-lg font-bold rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                                onClick={handlePayment}
                                disabled={paymentLoading}
                            >
                                {paymentLoading ? "Setting up Access..." : course.price > 0 ? "Unlock Full Access" : "Enroll for Free"}
                            </Button>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4 font-bold flex items-center gap-2 opacity-70">
                                <Sparkles className="h-3 w-3 text-yellow-500" /> Instant activation upon enrollment
                            </p>
                        </div>

                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/50">
                            <h3 className="font-bold text-lg mb-4">Inside this Masterclass:</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: "✨", label: "Lifetime content access" },
                                    { icon: "📱", label: "Mobile & Desktop friendly" },
                                    { icon: "🎓", label: "Verified Certificate" },
                                    { icon: "📚", label: `${course.lessons.length} Expert Lessons` }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                                        <span className="w-8 h-8 rounded-lg bg-white dark:bg-black/20 flex items-center justify-center shadow-sm">{item.icon}</span>
                                        {item.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 group">
                        {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full ${course.color || "bg-primary"} opacity-20`} />
                        )}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center p-1 border border-white/30 shadow-2xl">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center pl-1 text-primary shadow-inner">
                                    <Lock className="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Content Preview Area */}
                <div className="mt-20 space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold tracking-tight">Curriculum Breakdown</h2>
                        <p className="text-muted-foreground font-medium">Take a look at what's waiting for you inside this masterclass.</p>
                    </div>
                    <div className="grid gap-4">
                        {course.lessons.map((lesson, index) => (
                            <div key={lesson.id} className="p-5 flex items-center justify-between bg-muted/40 rounded-2xl border border-border/50 hover:bg-muted/60 transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-sm font-extrabold shadow-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-none">{lesson.title}</p>
                                        <p className="text-xs text-muted-foreground font-semibold mt-1.5 uppercase tracking-wider">{lesson.duration}</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground px-3 py-1.5 rounded-full uppercase tracking-widest border border-border/50">
                                    Locked Selection
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Payment Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Secure Checkout</DialogTitle>
                            <DialogDescription>
                                Complete your enrollment for {course.title}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            {processingStep === 'idle' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                                        <span className="font-medium">Total Amount</span>
                                        <span className="text-xl font-bold">₹{course.price}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground text-center">
                                        This is a secure 128-bit SSL encrypted payment.
                                    </div>
                                </div>
                            )}

                            {processingStep === 'processing' && (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="font-medium">Processing secure payment...</p>
                                </div>
                            )}

                            {processingStep === 'success' && (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <p className="font-bold text-lg">Payment Successful!</p>
                                    <p className="text-muted-foreground text-center">Redirecting you to the course...</p>
                                </div>
                            )}
                        </div>

                        {processingStep === 'idle' && (
                            <div className="flex flex-col gap-2">
                                <Button size="lg" className="w-full font-bold" onClick={processMockPayment} disabled={paymentLoading}>
                                    Confirm Payment of ₹{course.price}
                                </Button>
                                <Button variant="ghost" className="w-full" onClick={() => setShowPaymentDialog(false)} disabled={paymentLoading}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6">
            <div className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/my-learning")}
                        className="mb-4 p-0 h-auto font-bold flex items-center gap-2 group hover:bg-transparent opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Back to My Learning</span>
                    </Button>
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">{course.title}</h1>
                        <p className="text-muted-foreground font-medium text-sm md:text-sm leading-relaxed max-w-3xl opacity-80">{course.description}</p>
                    </div>
                </div>
            </div>

            <div className={`grid grid-cols-1 ${showAISidebar ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 transition-all duration-300`}>
                {/* Video Player Section */}
                <div className={`${showAISidebar ? 'lg:col-span-2' : 'lg:col-span-2'} space-y-4`}>
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border relative group">
                        {activeLesson ? (
                            <div className="w-full h-full relative">
                                {activeLesson.type === 'quiz' && activeLesson.quizId ? (
                                    <div className="h-full overflow-y-auto">
                                        <QuizPlayer
                                            quizId={activeLesson.quizId.toString()}
                                            onComplete={(score: number, passed: boolean) => {
                                                console.log('Quiz completed:', score, passed);
                                                saveProgress(passed, 0); // Save as completed if passed
                                            }}
                                        />
                                    </div>
                                ) : (
                                    /* REPLACED ReactPlayer with Native Video for Reliability */
                                    <video
                                        key={activeLesson.id}
                                        className="w-full h-full object-contain"
                                        src={activeLesson.videoUrl}
                                        controls
                                        crossOrigin="anonymous"
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onEnded={handleEnded}
                                        onCanPlay={handleReady}
                                        onTimeUpdate={(e) => {
                                            const video = e.currentTarget;
                                            // Adapt native event to match ReactPlayer's expected format for handleProgress
                                            handleProgress({
                                                playedSeconds: video.currentTime,
                                                played: video.duration > 0 ? video.currentTime / video.duration : 0,
                                                loaded: 0,
                                                loadedSeconds: 0
                                            });
                                        }}
                                        onError={(e) => {
                                            console.error("Video Error:", e);
                                            setVideoError("Video playback failed. Please try downloading or opening in a new tab.");
                                        }}
                                    />
                                )}
                                {videoError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-10">
                                        <div className="text-center p-4">
                                            <p className="text-red-400 font-bold mb-2">Video Error</p>
                                            <p className="text-sm">{videoError}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4 text-black border-white/20 hover:bg-white/10 hover:text-white"
                                                onClick={() => window.open(activeLesson?.videoUrl, '_blank')}
                                            >
                                                Open in New Tab
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-foreground bg-muted">
                                <div className="text-center">
                                    <p className="text-lg font-black">No Lesson Selected</p>
                                    <p className="text-sm font-bold">Select a lesson from the playlist to start watching.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {activeLesson && (
                        <div className="p-4 rounded-lg bg-card border-2 shadow-xl flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black">{activeLesson.title}</h2>
                                <p className="text-sm text-foreground font-bold mt-1">
                                    Duration: {activeLesson.duration} •
                                    {progress[activeLesson.id]?.completed ? " Completed" : " In Progress"}
                                </p>
                            </div>
                            <Button
                                size="lg"
                                className="font-bold rounded-xl shadow-lg"
                                variant={progress[activeLesson.id]?.completed ? "outline" : "default"}
                                onClick={() => saveProgress(!progress[activeLesson.id]?.completed, getPlayerTime())}
                            >
                                {progress[activeLesson.id]?.completed ? (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> Completed
                                    </>
                                ) : (
                                    "Mark as Complete"
                                )}
                            </Button>
                        </div>
                    )}

                    {/* AI Tools Strip (Hidden for now) */}
                    {/* {activeLesson && activeLesson.type !== 'quiz' && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
                                onClick={() => setShowAISidebar(!showAISidebar)}
                            >
                                <Bot className="w-4 h-4 text-primary" />
                                {showAISidebar ? "Close AI Tutor" : "Ask AI Tutor"}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={handleGenerateSummary}
                                disabled={summaryLoading || !activeLesson.transcript}
                            >
                                {summaryLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileText className="w-4 h-4" />
                                )}
                                {lessonSummary ? "View Summary" : "Smart Summary"}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={handleGeneratePracticeQuiz}
                                disabled={aiQuizLoading}
                            >
                                {aiQuizLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {aiQuizData ? "Retake Practice" : "Practice Quiz"}
                            </Button>
                        </div>
                    )} */}
                </div>

                {/* AI Sidebar Area */}
                {showAISidebar && activeLesson && (
                    <div className="lg:col-span-1 h-[600px] animate-in slide-in-from-right duration-300">
                        <AIChatSidebar
                            courseId={course.id}
                            lessonId={activeLesson.id}
                            lessonTitle={activeLesson.title}
                            onClose={() => setShowAISidebar(false)}
                        />
                    </div>
                )}

                {/* Playlist Section */}
                <div className="lg:col-span-1">
                    <Card className="h-full max-h-[600px] flex flex-col shadow-xl border-2">
                        <div className="p-4 border-b bg-muted">
                            <h3 className="font-black text-lg">Course Content</h3>
                            <p className="text-xs text-foreground font-bold mt-1">
                                {Object.values(progress).filter(p => p.completed).length} / {course.lessons.length} Completed
                            </p>
                            {/* Progress Bar */}
                            <div className="w-full bg-secondary h-3 rounded-full mt-3 overflow-hidden shadow-inner">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-300 shadow-md"
                                    style={{ width: `${(Object.values(progress).filter(p => p.completed).length / course.lessons.length) * 100}%` }}
                                ></div>
                            </div>

                            {/* Certificate Button */}
                            {(Object.values(progress).filter(p => p.completed).length === course.lessons.length) && course.lessons.length > 0 && (
                                <Button
                                    onClick={handleDownloadCertificate}
                                    className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white gap-2 animate-pulse"
                                >
                                    <Award className="w-4 h-4" />
                                    Download Certificate
                                </Button>
                            )}
                        </div>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            {course.lessons.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No lessons available yet.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {course.lessons.map((lesson, index) => {
                                        const isCompleted = progress[lesson.id]?.completed;
                                        const isActive = activeLesson?.id === lesson.id;

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => handleLessonChange(lesson)}
                                                className={cn(
                                                    "w-full text-left p-4 hover:bg-muted font-bold transition-all flex gap-3 group relative",
                                                    isActive ? "bg-primary text-white" : ""
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 transition-colors shadow-sm",
                                                    isCompleted ? "bg-green-600 text-white" : (isActive ? "bg-white text-primary" : "bg-muted-foreground text-white")
                                                )}>
                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-sm font-black truncate",
                                                        isActive ? "text-white" : "text-foreground",
                                                        isCompleted && !isActive && "text-muted-foreground line-through decoration-slate-400"
                                                    )}>
                                                        {lesson.title}
                                                    </p>
                                                    <p className={cn(
                                                        "text-[10px] font-bold mt-0.5",
                                                        isActive ? "text-white/90" : "text-muted-foreground"
                                                    )}>{lesson.duration}</p>
                                                </div>
                                                {isActive && (
                                                    <div className="ml-auto self-center">
                                                        <PlayCircle className="w-5 h-5 text-white animate-pulse" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI Summary Dialog */}
            <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Lesson Summary: {activeLesson?.title}
                        </DialogTitle>
                        <DialogDescription>
                            AI-generated key points and takeaways from this lesson.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-6 bg-muted/30 rounded-xl border prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
                        {lessonSummary}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>Close</Button>
                        <Button onClick={() => setShowAISidebar(true)}>Ask Questions</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Practice Quiz Dialog */}
            <Dialog open={showAiQuizDialog} onOpenChange={setShowAiQuizDialog}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            AI Practice Quiz: {activeLesson?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Test your knowledge with these AI-generated questions based on the lesson.
                        </DialogDescription>
                    </DialogHeader>
                    {aiQuizData && (
                        <div className="mt-4">
                            <QuizPlayer
                                quizData={aiQuizData}
                                onComplete={(score, passed) => {
                                    console.log('AI Practice Quiz score:', score, passed);
                                }}
                            />
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={() => setShowAiQuizDialog(false)}>Finish Practice</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
