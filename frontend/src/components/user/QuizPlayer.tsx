import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { CheckCircle, XCircle, Clock, AlertCircle, PlayCircle, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { quizzesAPI } from '../../lib/api';

interface QuizPlayerProps {
    quizId?: string;
    quizData?: any;
    onComplete?: (score: number, passed: boolean) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, quizData, onComplete }) => {
    const { submitQuiz } = useStore();
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({}); // questionIndex -> optionIndex
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (quizData) {
            setQuiz(quizData);
            if (quizData.timeLimit > 0) {
                setTimeLeft(quizData.timeLimit * 60);
            }
            setLoading(false);
            return;
        }

        if (!quizId) return;

        const fetchQuiz = async () => {
            try {
                const res = await quizzesAPI.getQuiz(quizId);
                setQuiz(res.data.data);
                if (res.data.data.timeLimit > 0) {
                    setTimeLeft(res.data.data.timeLimit * 60);
                }
            } catch (error) {
                console.error('Error loading quiz:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId, quizData]);

    useEffect(() => {
        if (timeLeft === null || result) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, result]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optionIndex: number) => {
        setAnswers({ ...answers, [currentQuestionIndex]: optionIndex });
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (quizData) {
                // Local calculation for practice quizzes
                let score = 0;
                quiz.questions.forEach((q: any, i: number) => {
                    if (answers[i] === q.correctOptionIndex) score++;
                });

                const percentage = (score / quiz.questions.length) * 100;
                const passed = percentage >= (quiz.passingScore || 70);

                const res = {
                    score,
                    maxScore: quiz.questions.length,
                    percentage,
                    passed
                };

                setResult(res);
                if (onComplete) onComplete(score, passed);
                return;
            }

            if (!quizId) return;

            // Format answers for API
            const formattedAnswers = Object.keys(answers).map(key => ({
                questionIndex: parseInt(key),
                selectedOptionIndex: answers[parseInt(key)]
            }));

            const res = await submitQuiz(quizId, formattedAnswers);
            setResult(res);
            if (onComplete) onComplete(res.score, res.passed);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Failed to submit quiz. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-400 py-10">Loading quiz...</div>;
    }

    if (!quiz) {
        return <div className="text-center text-red-400 py-10">Failed to load quiz.</div>;
    }

    // Result View
    if (result) {
        return (
            <div className="bg-card border-none rounded-[2rem] p-10 text-center space-y-8 animate-in zoom-in duration-500">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${result.passed ? 'bg-green-500 shadow-green-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                    {result.passed ? <CheckCircle className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tight">
                        {result.passed ? 'Fantastic Achievement!' : 'Keep Pushing!'}
                    </h2>
                    <p className="text-muted-foreground text-lg font-bold">
                        You've reached the end of the assessment for <span className="text-foreground">{quiz.title}</span>.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-3xl p-8 grid grid-cols-2 gap-4 border border-border/50">
                    <div className="text-center p-4">
                        <p className="text-3xl font-black text-primary">{result.score} / {result.maxScore}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Score</p>
                    </div>
                    <div className="text-center p-4 border-l border-border/50">
                        <p className="text-3xl font-black text-primary">{result.percentage.toFixed(0)}%</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Accuracy</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                    {!result.passed && (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20"
                        >
                            <RotateCcw className="w-5 h-5" /> Retake Assessment
                        </button>
                    )}
                    <button
                        onClick={() => window.location.reload()} // Just to refresh state/close
                        className="px-8 py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black transition-all"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    // Quiz View
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div
            className="w-full space-y-6 lg:p-4 select-none"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black truncate">{quiz.title}</h2>
                {timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl shadow-xl border-4 ${timeLeft < 60 ? 'bg-red-600 border-red-800 text-white animate-pulse' : 'bg-background border-primary text-primary'}`}>
                        <Clock className="h-6 w-6" />
                        <span className="font-mono font-black text-xl">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            {/* Progress */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm font-black text-foreground uppercase tracking-wider">
                    <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                    <span>{Object.keys(answers).length} answered</span>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden border-2 border-border shadow-inner">
                    <div className="h-full bg-primary transition-all duration-500 shadow-lg shadow-primary/20" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Question Card */}
            <Card className="p-8 border-4 border-border/50 shadow-2xl rounded-[2rem] bg-card/50 backdrop-blur-sm">
                <h2 className="text-2xl font-black mb-10 leading-tight">
                    {currentQuestion.questionText}
                </h2>
                <div className="space-y-4">
                    {currentQuestion.options.map((option: string, index: number) => {
                        const isSelected = answers[currentQuestionIndex] === index;
                        return (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(index)}
                                className={`w-full p-6 text-left border-4 rounded-2xl transition-all font-black group relative overflow-hidden ${isSelected
                                    ? 'border-primary bg-primary text-white shadow-xl scale-[1.01]'
                                    : 'border-border bg-muted/30 hover:bg-muted hover:border-primary/30 text-foreground/80'
                                    }`}
                            >
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`w-7 h-7 rounded-full border-4 flex items-center justify-center shrink-0 transition-colors ${isSelected
                                            ? 'border-white bg-white'
                                            : 'border-primary'
                                        }`}>
                                        {isSelected && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="text-lg">{option}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 border-4 font-black rounded-2xl"
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous
                </Button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <Button
                        size="lg"
                        className="h-14 px-10 font-black rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        onClick={handleSubmit}
                        disabled={submitting || (Object.keys(answers).length === 0)}
                    >
                        {submitting ? (
                            <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Submitting...</>
                        ) : (
                            <><PlayCircle className="mr-2 h-5 w-5" /> Submit Assessment</>
                        )}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="h-14 px-10 font-black rounded-2xl"
                        onClick={handleNext}
                    >
                        Next Question
                        <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                )}
            </div>

            {/* Question Overview Grid */}
            <Card className="p-6 border-4 border-dashed border-border/50 bg-muted/20 opacity-90 rounded-[2rem]">
                <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4 flex justify-between items-center">
                    <span>Question Overview</span>
                    <span className="text-xs">{Object.keys(answers).length} / {quiz.questions.length} Complete</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {quiz.questions.map((_: any, index: number) => {
                        const isCurrent = currentQuestionIndex === index;
                        const isAnswered = answers[index] !== undefined;
                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black transition-all border-4 shadow-md ${isCurrent
                                    ? 'bg-primary text-white border-primary scale-110 z-10 shadow-primary/30'
                                    : isAnswered
                                        ? 'bg-green-600 text-white border-green-800'
                                        : 'bg-muted border-border hover:border-primary/30'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default QuizPlayer;
