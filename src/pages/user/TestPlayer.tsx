import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { testsAPI } from '@/lib/api';

export default function TestPlayer() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [suspiciousEvents, setSuspiciousEvents] = useState<Array<{ eventType: string; occurredAt: string; meta?: any }>>([]);

    useEffect(() => {
        fetchTest();
    }, [slug]);

    useEffect(() => {
        if (test && test.timeLimit > 0 && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [test, timeLeft]);

    // Proctoring: Tab Switching Logic
    useEffect(() => {
        if (!test || submitting) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerWarning('visibility_hidden', { hidden: true });
            }
        };

        const handleBlur = () => {
            triggerWarning('window_blur');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                triggerWarning('fullscreen_exit');
            }
        };

        const handleCopy = () => triggerWarning('copy_attempt');
        const handlePaste = () => triggerWarning('paste_attempt');
        const handleContextMenu = () => triggerWarning('context_menu_open');

        const triggerWarning = (eventType = 'tab_switch', meta = {}) => {
            if (submitting) return;

            setSuspiciousEvents(prev => [...prev, { eventType, occurredAt: new Date().toISOString(), meta }]);

            setWarningCount(prev => {
                const newCount = prev + 1;

                // If limit reached, submit immediately
                if (test.maxWarnings > 0 && newCount >= test.maxWarnings) {
                    setShowWarning(false);
                    handleSubmit("Excessive tab switching detected (Proctoring Enforcement)");
                    return newCount;
                }

                setShowWarning(true);
                return newCount;
            });
        };

        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [test, submitting]);

    const fetchTest = async () => {
        try {
            // Check if there's a test-specific token (for password-based auth)
            const testToken = localStorage.getItem(`test_token_${slug}`);
            const testDataStr = localStorage.getItem(`test_data_${slug}`);

            if (testToken && testDataStr) {
                // For password-based tests, load from localStorage
                const testData = JSON.parse(testDataStr);
                setTest(testData);
                if (testData.timeLimit > 0) {
                    setTimeLeft(testData.timeLimit * 60);
                }
                setLoading(false);
                return;
            }

            // For account-based tests, use normal authentication
            const res = await testsAPI.getBySlug(slug!);
            if (res.data.alreadyAttempted) {
                navigate(`/test/${slug}`);
                return;
            }
            setTest(res.data.data);
            if (res.data.data.timeLimit > 0) {
                setTimeLeft(res.data.data.timeLimit * 60);
            }
        } catch (error) {
            console.error('Error fetching test:', error);
            navigate(`/test/${slug}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        setAnswers({ ...answers, [currentQuestion]: optionIndex });
    };

    const handleSubmit = async (reason?: string) => {
        if (submitting) return;
        setSubmitting(true);

        if (reason) {
            alert(reason);
        }

        const formattedAnswers = Object.entries(answers).map(([qIndex, oIndex]) => ({
            questionIndex: parseInt(qIndex),
            selectedOptionIndex: oIndex
        }));

        try {
            // Get test token if it exists
            const testToken = localStorage.getItem(`test_token_${slug}`);
            await testsAPI.submit(test._id, formattedAnswers, testToken || undefined, {
                warningsCount: warningCount,
                events: suspiciousEvents
            });

            // Clean up localStorage (don't remove token yet, needed for result view)
            // localStorage.removeItem(`test_token_${slug}`); // Keep token to view result
            localStorage.removeItem(`test_data_${slug}`);

            navigate(`/test/${slug}`);
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Failed to submit test');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading || !test) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    const question = test.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / test.questions.length) * 100;

    return (
        <div
            className="min-h-screen bg-background p-4 select-none"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
        >
            {showWarning && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <Card className="max-w-md p-8 border-4 border-red-600 space-y-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 animate-pulse">
                            <AlertCircle className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-red-600 uppercase">Warning!</h2>
                            <p className="font-bold underline">Tab switching or leaving the screen is not allowed.</p>
                        </div>
                        <div className="bg-muted p-4 rounded-xl border-2">
                            <div className="text-sm font-bold opacity-70 uppercase tracking-widest">Warning Status</div>
                            <div className="text-3xl font-black">{warningCount} / {test.maxWarnings || '∞'}</div>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                            {test.maxWarnings > 0
                                ? "If you exceed the warning limit, your test will be automatically submitted."
                                : "Please return to the test screen immediately."}
                        </p>
                        <Button
                            className="w-full h-14 text-lg font-black"
                            onClick={() => setShowWarning(false)}
                        >
                            I Understand, Return to Test
                        </Button>
                    </Card>
                </div>
            )}
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    {test.timeLimit > 0 && (
                        <div className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-xl border-4 ${timeLeft < 60 ? 'bg-red-600 border-red-800 text-white animate-pulse' : 'bg-background border-primary text-primary'}`}>
                            <Clock className="h-6 w-6" />
                            <span className="font-mono font-black text-xl">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-black text-foreground uppercase tracking-wider">
                        <span>Question {currentQuestion + 1} of {test.questions.length}</span>
                        <span>{Object.keys(answers).length} answered</span>
                    </div>
                    <div className="w-full h-4 bg-muted rounded-full overflow-hidden border-2 border-border shadow-inner">
                        <div className="h-full bg-primary transition-all shadow-lg" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Question */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6">{question.questionText}</h2>
                    <div className="space-y-3">
                        {question.options.map((option: string, index: number) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`w-full p-5 text-left border-4 rounded-xl transition-all font-bold ${answers[currentQuestion] === index
                                    ? 'border-primary bg-primary text-white shadow-xl scale-[1.02]'
                                    : 'border-border bg-card hover:bg-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${answers[currentQuestion] === index
                                        ? 'border-white bg-white'
                                        : 'border-primary'
                                        }`}>
                                        {answers[currentQuestion] === index && (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="text-lg">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    {currentQuestion === test.questions.length - 1 ? (
                        <Button
                            onClick={() => handleSubmit()}
                            disabled={submitting || Object.keys(answers).length === 0}
                            className="px-8"
                        >
                            {submitting ? 'Submitting...' : 'Submit Test'}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQuestion(prev => Math.min(test.questions.length - 1, prev + 1))}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>

                {/* Question Grid */}
                <Card className="p-4">
                    <div className="text-sm font-semibold mb-3">Question Overview</div>
                    <div className="grid grid-cols-10 gap-2">
                        {test.questions.map((_: any, index: number) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestion(index)}
                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-black transition-all border-2 shadow-md ${currentQuestion === index
                                    ? 'bg-primary text-white border-primary scale-110 z-10'
                                    : answers[index] !== undefined
                                        ? 'bg-green-600 text-white border-green-800'
                                        : 'bg-muted border-border hover:bg-muted-foreground/20'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
