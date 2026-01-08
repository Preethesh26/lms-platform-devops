import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { testsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function TestEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState(0);
    const [passingScore, setPassingScore] = useState(70);
    const [hasDeadline, setHasDeadline] = useState(false);
    const [deadline, setDeadline] = useState('');
    const [sendResultsEmail, setSendResultsEmail] = useState(false);
    const [scheduleResultsEmail, setScheduleResultsEmail] = useState(false);
    const [resultsEmailDate, setResultsEmailDate] = useState('');
    const [requiresAccountLogin, setRequiresAccountLogin] = useState(false);
    const [questions, setQuestions] = useState([
        { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }
    ]);
    const [maxWarnings, setMaxWarnings] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode && id) {
            loadTestData();
        }
    }, [id, isEditMode]);

    const loadTestData = async () => {
        setLoading(true);
        try {
            const res = await testsAPI.getOne(id!);
            const test = res.data.data;

            setTitle(test.title);
            setDescription(test.description || '');
            setTimeLimit(test.timeLimit || 0);
            setPassingScore(test.passingScore || 70);
            setHasDeadline(test.hasDeadline || false);
            setDeadline(test.deadline ? new Date(test.deadline).toISOString().slice(0, 16) : '');
            setSendResultsEmail(test.sendResultsEmail || false);
            setScheduleResultsEmail(test.scheduleResultsEmail || false);
            setResultsEmailDate(test.resultsEmailDate ? new Date(test.resultsEmailDate).toISOString().slice(0, 16) : '');
            setRequiresAccountLogin(test.requiresAccountLogin || false);
            setMaxWarnings(test.maxWarnings || 0);
            setQuestions(test.questions || [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }]);
        } catch (error) {
            console.error('Error loading test:', error);
            alert('Failed to load test data');
            navigate('/admin/tests');
        } finally {
            setLoading(false);
        }
    };

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

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            // Skip header if present (check for "question" in first line)
            const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;
            const newQuestions = [];

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i];
                // Handle CSV parsing (simple comma split, careful with commas in text)
                // This is a simple implementation. For robust parsing, use a library.
                // Format: Question, Option1, Option2, Option3, Option4, CorrectIndex (1-4), Explanation
                const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma not in quotes

                if (parts.length >= 6) {
                    const clean = (s: string) => s ? s.trim().replace(/^"|"$/g, '').replace(/""/g, '"') : '';

                    const questionText = clean(parts[0]);
                    const options = [
                        clean(parts[1]),
                        clean(parts[2]),
                        clean(parts[3]),
                        clean(parts[4])
                    ];
                    // CSV uses 1-based index usually for humans, convert to 0-based
                    const correctOptionIndex = parseInt(clean(parts[5])) - 1;
                    const explanation = parts[6] ? clean(parts[6]) : '';

                    if (questionText && options.every(o => o) && !isNaN(correctOptionIndex)) {
                        newQuestions.push({
                            questionText,
                            options,
                            correctOptionIndex: Math.max(0, Math.min(3, correctOptionIndex)),
                            explanation
                        });
                    }
                }
            }

            if (newQuestions.length > 0) {
                // improved: append to existing or replace? Let's append but ask user? 
                // For simplicity, just append to current questions
                setQuestions([...questions, ...newQuestions]);
                alert(`Successfully added ${newQuestions.length} questions`);
            } else {
                alert('No valid questions found in CSV');
            }
        } catch (error) {
            console.error('Error uploading CSV:', error);
            alert('Failed to process CSV file');
        } finally {
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const testData = {
                title,
                description,
                timeLimit,
                passingScore,
                hasDeadline,
                deadline: hasDeadline ? deadline : undefined,
                sendResultsEmail,
                scheduleResultsEmail,
                resultsEmailDate: scheduleResultsEmail ? resultsEmailDate : undefined,
                requiresAccountLogin,
                maxWarnings,
                questions
            };

            if (isEditMode && id) {
                await testsAPI.update(id, testData);
            } else {
                await testsAPI.create(testData);
            }

            navigate('/admin/tests');
        } catch (error: any) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} test:`, error);
            const msg = error.response?.data?.error || error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} test`;
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? 'Edit Test' : 'Create New Test'}</h1>
                <p className="text-muted-foreground">{isEditMode ? 'Update test details and questions' : 'Create a standalone test with email invitations'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Test Details */}
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold">Test Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label>Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Time Limit (mins) - 0 for unlimited</Label>
                            <Input
                                type="number"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label>Passing Score (%)</Label>
                            <Input
                                type="number"
                                value={passingScore}
                                onChange={(e) => setPassingScore(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Deadline Settings */}
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold">Deadline Settings</h2>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasDeadline"
                            checked={hasDeadline}
                            onCheckedChange={(checked) => setHasDeadline(checked as boolean)}
                        />
                        <label htmlFor="hasDeadline" className="text-sm font-medium cursor-pointer">
                            Set a deadline for this test
                        </label>
                    </div>
                    {hasDeadline && (
                        <div>
                            <Label>Deadline</Label>
                            <Input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required={hasDeadline}
                            />
                        </div>
                    )}
                </div>

                {/* Email Settings */}
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold">Email Result Settings</h2>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="sendResultsEmail"
                            checked={sendResultsEmail}
                            onCheckedChange={(checked) => setSendResultsEmail(checked as boolean)}
                        />
                        <label htmlFor="sendResultsEmail" className="text-sm font-medium cursor-pointer">
                            Send results to users via email
                        </label>
                    </div>
                    {sendResultsEmail && (
                        <>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="scheduleResultsEmail"
                                    checked={scheduleResultsEmail}
                                    onCheckedChange={(checked) => setScheduleResultsEmail(checked as boolean)}
                                />
                                <label htmlFor="scheduleResultsEmail" className="text-sm font-medium cursor-pointer">
                                    Schedule email send time
                                </label>
                            </div>
                            {scheduleResultsEmail && (
                                <div>
                                    <Label>Send Results On</Label>
                                    <Input
                                        type="datetime-local"
                                        value={resultsEmailDate}
                                        onChange={(e) => setResultsEmailDate(e.target.value)}
                                        required={scheduleResultsEmail}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Authentication Method */}
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold">Authentication Method</h2>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <input
                                type="radio"
                                id="uniquePassword"
                                name="authMethod"
                                checked={!requiresAccountLogin}
                                onChange={() => setRequiresAccountLogin(false)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <label htmlFor="uniquePassword" className="font-medium cursor-pointer block">
                                    Unique Passwords (Recommended)
                                </label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Each invited user receives a unique password via email. No LMS account required. Perfect for external candidates.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <input
                                type="radio"
                                id="accountLogin"
                                name="authMethod"
                                checked={requiresAccountLogin}
                                onChange={() => setRequiresAccountLogin(true)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <label htmlFor="accountLogin" className="font-medium cursor-pointer block">
                                    LMS Account Login
                                </label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Users must log in with their LMS account. Only for registered students.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proctoring Settings */}
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold">Proctoring Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Max Tab-Switch Warnings</Label>
                            <Input
                                type="number"
                                value={maxWarnings}
                                onChange={(e) => setMaxWarnings(Number(e.target.value))}
                                min={0}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                0 = Warnings only (Unlimited). Test will auto-submit when limit is reached.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Questions</h2>
                        <div className="flex gap-2">
                            <a
                                href="/test_questions_template.csv"
                                download
                                className="text-sm text-primary hover:underline flex items-center mr-4"
                            >
                                Download Template
                            </a>
                            <Label htmlFor="question-csv" className="cursor-pointer">
                                <div className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80">
                                    Import CSV
                                </div>
                            </Label>
                            <Input
                                id="question-csv"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleCSVUpload}
                            />
                        </div>
                    </div>
                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="bg-card border rounded-xl p-6 relative">
                            <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIndex)}
                                className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-medium mb-4">Question {qIndex + 1}</h3>
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        placeholder="Enter question text"
                                        value={question.questionText}
                                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
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
                                            />
                                            <Input
                                                placeholder={`Option ${oIndex + 1}`}
                                                value={option}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <Input
                                        placeholder="Explanation (Optional)"
                                        value={question.explanation}
                                        onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-3 border-2 border-dashed rounded-xl text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add Question
                    </button>
                </div>

                <div className="flex justify-end pt-6">
                    <Button type="submit" className="flex items-center gap-2">
                        {isSubmitting ? 'Saving...' : <><Save className="w-5 h-5" /> Save Test</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
