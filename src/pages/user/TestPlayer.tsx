import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        const formattedAnswers = Object.entries(answers).map(([qIndex, oIndex]) => ({
            questionIndex: parseInt(qIndex),
            selectedOptionIndex: oIndex
        }));

        try {
            await testsAPI.submit(test._id, formattedAnswers);

            // Clean up localStorage
            localStorage.removeItem(`test_token_${slug}`);
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
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    {test.timeLimit > 0 && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 dark:bg-red-950 text-red-600' : 'bg-muted'}`}>
                            <Clock className="h-5 w-5" />
                            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Question {currentQuestion + 1} of {test.questions.length}</span>
                        <span>{Object.keys(answers).length} answered</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
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
                                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${answers[currentQuestion] === index
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion] === index
                                        ? 'border-primary bg-primary'
                                        : 'border-border'
                                        }`}>
                                        {answers[currentQuestion] === index && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span>{option}</span>
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
                            onClick={handleSubmit}
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
                                className={`aspect-square rounded flex items-center justify-center text-sm font-medium transition-all ${currentQuestion === index
                                    ? 'bg-primary text-primary-foreground'
                                    : answers[index] !== undefined
                                        ? 'bg-green-100 dark:bg-green-950 text-green-600'
                                        : 'bg-muted hover:bg-muted/80'
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
