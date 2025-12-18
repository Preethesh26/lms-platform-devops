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
import { CheckCircle, PlayCircle, Lock, Award, Download } from "lucide-react";

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
            <div className="container mx-auto p-4 max-w-5xl py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
                            <p className="text-xl text-muted-foreground">{course.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold text-primary">
                                {course.price > 0 ? `₹${course.price}` : "Free"}
                            </div>
                            {course.price > 0 && (
                                <span className="text-sm text-muted-foreground line-through">₹{course.price + 1000}</span>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                size="lg"
                                className="w-full md:w-auto text-lg px-8"
                                onClick={handlePayment}
                                disabled={paymentLoading}
                            >
                                {paymentLoading ? "Processing..." : course.price > 0 ? "Buy Now & Enroll" : "Enroll for Free"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-3 text-center md:text-left">
                                Secure payment via Razorpay. Instant access after payment.
                            </p>
                        </div>

                        <div className="bg-muted/30 p-6 rounded-xl border">
                            <h3 className="font-semibold mb-3">What you'll learn:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm">
                                    <span className="text-green-500">✓</span> Full lifetime access
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <span className="text-green-500">✓</span> Access on mobile and desktop
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <span className="text-green-500">✓</span> Certificate of completion
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <span className="text-green-500">✓</span> {course.lessons.length} comprehensive lessons
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10">
                        <img
                            src={course.thumbnail || "/placeholder-course.jpg"}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center pl-1">
                                    <Lock className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Content Preview */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">Course Content</h2>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {course.lessons.map((lesson, index) => (
                                    <div key={lesson.id} className="p-4 flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{lesson.title}</p>
                                                <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs font-medium bg-muted px-2 py-1 rounded">
                                            Locked 🔒
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Mock Payment Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {processingStep === 'idle' && 'Confirm Payment'}
                                {processingStep === 'processing' && 'Processing Payment...'}
                                {processingStep === 'success' && 'Payment Successful!'}
                            </DialogTitle>
                            <DialogDescription>
                                {processingStep === 'idle' && `You are about to enroll in ${course.title}`}
                                {processingStep === 'processing' && 'Please wait while we process your payment'}
                                {processingStep === 'success' && 'You have been successfully enrolled!'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            {processingStep === 'idle' && (
                                <div className="space-y-4">
                                    <div className="bg-muted/30 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Course:</span>
                                            <span className="text-muted-foreground">{course.title}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="font-medium">Amount:</span>
                                            <span className="text-lg font-bold text-primary">
                                                {course.price > 0 ? `₹${course.price}` : 'Free'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setShowPaymentDialog(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={processMockPayment}
                                        >
                                            {course.price > 0 ? 'Pay Now' : 'Enroll Free'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {processingStep === 'processing' && (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-muted-foreground">Processing your payment...</p>
                                </div>
                            )}

                            {processingStep === 'success' && (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Redirecting to course...</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => navigate("/my-learning")}>
                    ← Back to My Learning
                </Button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                        <p className="text-muted-foreground mt-2">{course.description}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
                        {activeLesson ? (
                            <div className="w-full h-full relative">
                                {activeLesson.type === 'quiz' && activeLesson.quizId ? (
                                    <div className="h-full overflow-y-auto">
                                        <QuizPlayer
                                            quizId={activeLesson.quizId.toString()}
                                            onComplete={(score, passed) => {
                                                console.log('Quiz completed:', score, passed);
                                                saveProgress(passed, 0); // Save as completed if passed
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <ReactPlayerAny
                                        key={activeLesson.id}
                                        ref={playerRef}
                                        url={activeLesson.videoUrl}
                                        width="100%"
                                        height="100%"
                                        controls={true}
                                        playing={isPlaying}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onProgress={handleProgress as any}
                                        onEnded={handleEnded}
                                        onReady={handleReady}
                                        onError={(e: any) => {
                                            console.error("Video Error:", e);
                                            setVideoError("Failed to load video. The URL might be invalid or protected.");
                                        }}
                                        progressInterval={5000}
                                        config={{
                                            youtube: {
                                                playerVars: { showinfo: 1 }
                                            }
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
                            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/20">
                                <div className="text-center">
                                    <p className="text-lg font-medium">No Lesson Selected</p>
                                    <p className="text-sm">Select a lesson from the playlist to start watching.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {activeLesson && (
                        <div className="p-4 rounded-lg bg-card border shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold">{activeLesson.title}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Duration: {activeLesson.duration} •
                                    {progress[activeLesson.id]?.completed ? " Completed" : " In Progress"}
                                </p>
                            </div>
                            <Button
                                variant={progress[activeLesson.id]?.completed ? "outline" : "default"}
                                onClick={() => saveProgress(!progress[activeLesson.id]?.completed, getPlayerTime())}
                            >
                                {progress[activeLesson.id]?.completed ? (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Completed
                                    </>
                                ) : (
                                    "Mark as Complete"
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Playlist Section */}
                <div className="lg:col-span-1">
                    <Card className="h-full max-h-[600px] flex flex-col">
                        <div className="p-4 border-b bg-muted/30">
                            <h3 className="font-semibold">Course Content</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {Object.values(progress).filter(p => p.completed).length} / {course.lessons.length} Completed
                            </p>
                            {/* Progress Bar */}
                            <div className="w-full bg-secondary h-2 rounded-full mt-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
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
                                                    "w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 group relative",
                                                    isActive ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0 transition-colors",
                                                    isCompleted ? "bg-green-100 text-green-600" : (isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
                                                )}>
                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-sm font-medium truncate",
                                                        isActive ? "text-primary" : "text-foreground",
                                                        isCompleted && !isActive && "text-muted-foreground line-through decoration-slate-400/50"
                                                    )}>
                                                        {lesson.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration}</p>
                                                </div>
                                                {isActive && (
                                                    <div className="ml-auto self-center">
                                                        <PlayCircle className="w-4 h-4 text-primary animate-pulse" />
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
        </div>
    );
}
