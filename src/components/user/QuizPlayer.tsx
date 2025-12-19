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
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center space-y-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {result.passed ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{result.passed ? 'Quiz Passed!' : 'Quiz Failed'}</h2>
                    <p className="text-gray-400">
                        You scored <span className="text-white font-bold">{result.score}</span> out of <span className="text-white font-bold">{result.maxScore}</span> ({result.percentage.toFixed(0)}%)
                    </p>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => window.location.reload()} // Quick restart
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Retake Quiz
                    </button>
                </div>
            </div>
        );
    }

    // Quiz View
    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div>
                    <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
                    <span className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                </div>
                {timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-8">
                <div className="text-lg text-white font-medium">
                    {currentQuestion.questionText}
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option: string, index: number) => (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${answers[currentQuestionIndex] === index
                                ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${answers[currentQuestionIndex] === index
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-500'
                                    }`}>
                                    {answers[currentQuestionIndex] === index && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span>{option}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-between items-center bg-black/20">
                <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || (Object.keys(answers).length < quiz.questions.length)} // Require all answers? Maybe not.
                        className="px-8 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="px-8 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizPlayer;
