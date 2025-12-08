import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash, Check, Save, ArrowLeft } from 'lucide-react';

const QuizEditor = () => {
    const navigate = useNavigate();
    const { courses, createQuiz } = useStore();
    const [title, setTitle] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [timeLimit, setTimeLimit] = useState(0);
    const [passingScore, setPassingScore] = useState(70);
    const [questions, setQuestions] = useState([
        { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddQuestion = () => {
        setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }]);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const newQuestions = [...questions];
        // @ts-ignore
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) {
            alert('Please select a course');
            return;
        }
        setIsSubmitting(true);
        try {
            await createQuiz({
                title,
                course: selectedCourse,
                timeLimit,
                passingScore,
                questions
            });
            navigate('/admin/courses');
        } catch (error) {
            console.error('Failed to create quiz:', error);
            alert('Failed to create quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Create New Quiz
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Quiz Details */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Course</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                required
                            >
                                <option value="">Select a Course</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Time Limit (mins) - 0 for unlimited</label>
                            <input
                                type="number"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Passing Score (%)</label>
                            <input
                                type="number"
                                value={passingScore}
                                onChange={(e) => setPassingScore(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="bg-white/5 border border-white/10 rounded-xl p-6 relative">
                            <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIndex)}
                                className="absolute top-4 right-4 text-red-400 hover:text-red-300"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-medium mb-4">Question {qIndex + 1}</h3>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter question text"
                                        value={question.questionText}
                                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {question.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                checked={question.correctOptionIndex === oIndex}
                                                onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)}
                                                className="text-purple-500 focus:ring-purple-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder={`Option ${oIndex + 1}`}
                                                value={option}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                className={`w-full bg-black/20 border ${question.correctOptionIndex === oIndex ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-white/10'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Explanation (Optional)"
                                        value={question.explanation}
                                        onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add Question
                    </button>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? 'Saving...' : <><Save className="w-5 h-5" /> Save Quiz</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuizEditor;
