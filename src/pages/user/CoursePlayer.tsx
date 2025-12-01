import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, type Course, type Lesson } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
                console.log('Checking enrollment:', {
                    courseId: foundCourse.id,
                    userRole: currentUser.role,
                    enrolledCourses: currentUser.enrolledCourses,
                    isEnrolledInCourse: currentUser.enrolledCourses?.includes(foundCourse.id),
                    isAdmin: currentUser.role === 'admin'
                });

                const enrolled = currentUser.enrolledCourses?.some(id => id.toString() === foundCourse.id.toString()) || currentUser.role === 'admin';
                setIsEnrolled(enrolled);

                if (enrolled && foundCourse.lessons.length > 0) {
                    setActiveLesson(foundCourse.lessons[0]);
                }
            } else {
                navigate("/my-learning");
            }
        }
    }, [isInitialized, params.courseId, courses, navigate, currentUser]);

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

    if (!isInitialized || !course) {
        return <div className="p-8 text-center">Loading course...</div>;
    }

    // If not enrolled, show Course Details & Payment UI
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
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
                                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
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
