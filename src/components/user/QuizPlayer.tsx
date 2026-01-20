import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { CheckCircle, XCircle, Clock, AlertCircle, PlayCircle, RotateCcw } from 'lucide-react';
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

    return (
        <div className="w-full">
            {/* Top Progress Bar */}
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-8">
                <div
                    className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                />
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Header Info */}
                <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">Assessment Progress</span>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black">{quiz.title}</h2>
                            <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {currentQuestionIndex + 1} / {quiz.questions.length}
                            </span>
                        </div>
                    </div>
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/20 text-red-600 animate-pulse' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div className="text-2xl font-black leading-tight tracking-tight">
                        {currentQuestion.questionText}
                    </div>

                    <div className="grid gap-4">
                        {currentQuestion.options.map((option: string, index: number) => {
                            const isSelected = answers[currentQuestionIndex] === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    className={`w-full text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 relative group overflow-hidden ${isSelected
                                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5'
                                        : 'border-border bg-card hover:border-primary/30 hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 font-black text-sm transition-colors ${isSelected
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-border bg-muted/50 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary'
                                            }`}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className={`text-lg font-bold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{option}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300">
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center gap-4 pt-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0}
                        className="px-8 py-4 text-sm font-black text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all flex items-center gap-2"
                    >
                        Previous Question
                    </button>

                    <div className="flex-1 flex justify-end">
                        {currentQuestionIndex === quiz.questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || (Object.keys(answers).length < quiz.questions.length)}
                                className="px-12 py-4 bg-primary text-white rounded-2xl font-black hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {submitting ? (
                                    <>Processing Result...</>
                                ) : (
                                    <><PlayCircle className="w-5 h-5" /> Submit Final Assessment</>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={answers[currentQuestionIndex] === undefined}
                                className="px-10 py-4 bg-foreground text-background dark:bg-white dark:text-black rounded-2xl font-black hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next Question
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPlayer;
