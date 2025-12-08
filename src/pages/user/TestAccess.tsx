import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { testsAPI } from '@/lib/api';
import { useStore } from '@/lib/store';

export default function TestAccess() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useStore();
    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alreadyAttempted, setAlreadyAttempted] = useState(false);
    const [attempt, setAttempt] = useState<any>(null);

    useEffect(() => {
        if (!currentUser) {
            navigate(`/login?redirect=/test/${slug}`);
            return;
        }
        fetchTest();
    }, [currentUser, slug]);

    const fetchTest = async () => {
        try {
            const res = await testsAPI.getBySlug(slug!);
            if (res.data.alreadyAttempted) {
                setAlreadyAttempted(true);
                setAttempt(res.data.attempt);
            } else {
                setTest(res.data.data);
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to load test');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = () => {
        navigate(`/test/${slug}/take`);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (alreadyAttempted && attempt) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Test Already Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-muted-foreground">
                            You have already completed this test. You can only take this test once.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{attempt.score}/{attempt.maxScore}</div>
                                <div className="text-sm text-muted-foreground">Score</div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{attempt.percentage.toFixed(0)}%</div>
                                <div className="text-sm text-muted-foreground">Percentage</div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${attempt.passed ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                            <div className={`text-lg font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.passed ? '✓ Passed' : '✗ Failed'}
                            </div>
                        </div>

                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!test) return null;

    return (
        <div className="flex h-screen items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">{test.title}</CardTitle>
                    {test.description && (
                        <p className="text-muted-foreground">{test.description}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <div className="font-semibold">{test.questions.length}</div>
                                <div className="text-sm text-muted-foreground">Questions</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <div className="font-semibold">
                                    {test.timeLimit > 0 ? `${test.timeLimit} mins` : 'Unlimited'}
                                </div>
                                <div className="text-sm text-muted-foreground">Time Limit</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                        <div className="font-semibold mb-2">Passing Score</div>
                        <div className="text-2xl font-bold">{test.passingScore}%</div>
                    </div>

                    {test.hasDeadline && test.deadline && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                            <div className="font-semibold text-orange-600 mb-1">Deadline</div>
                            <div>{new Date(test.deadline).toLocaleString()}</div>
                        </div>
                    )}

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="font-semibold text-yellow-600 mb-2">Important</div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• You can only take this test once</li>
                            <li>• Make sure you have a stable internet connection</li>
                            <li>• Do not refresh the page during the test</li>
                            {test.timeLimit > 0 && <li>• The timer will start when you begin</li>}
                        </ul>
                    </div>

                    <Button onClick={handleStartTest} className="w-full" size="lg">
                        Start Test
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
