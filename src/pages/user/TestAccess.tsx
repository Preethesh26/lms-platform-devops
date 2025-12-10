import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';
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

    // For password-based auth
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authenticating, setAuthenticating] = useState(false);
    const [authError, setAuthError] = useState('');
    const [testToken, setTestToken] = useState('');

    useEffect(() => {
        // Try to authenticate with password first (no user account needed)
        fetchTestInfo();
    }, [slug]);

    const fetchTestInfo = async () => {
        try {
            // Check for existing token and attempt
            const savedToken = localStorage.getItem(`test_token_${slug}`);
            if (savedToken) {
                setTestToken(savedToken);
                try {
                    const resultRes = await testsAPI.getResult(slug!, savedToken); // slug is testId? No getbySlug returns data.
                    // Wait, getResult expects ID, not Slug. 
                    // But we don't have ID easily unless we call public info first.
                } catch (e) {
                    // ignore
                }
            }

            // First, try to get basic test info without authentication
            const res = await testsAPI.getBySlug(slug!);
            setTest(res.data.data);

            // If we have a token, try to fetch the result properly using the ID from the fetched test
            if (savedToken && res.data.data._id) {
                try {
                    const resultRes = await testsAPI.getResult(res.data.data._id, savedToken);
                    if (resultRes.data.success) {
                        setAlreadyAttempted(true);
                        setAttempt(resultRes.data.data);
                    }
                } catch (err) {
                    // Token might be expired or invalid, just ignore
                }
            }

            // If test requires account login and user is not logged in, redirect
            if (res.data.data.requiresAccountLogin && !currentUser) {
                navigate(`/login?redirect=/test/${slug}`);
                return;
            }

        } catch (error: any) {
            // If it requires account login and user not logged in
            if (error.response?.data?.requiresAccountLogin && !currentUser) {
                navigate(`/login?redirect=/test/${slug}`);
                return;
            }
            setError(error.response?.data?.error || 'Failed to load test');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthenticating(true);

        try {
            const res = await testsAPI.authenticate(slug!, email, password);

            if (res.data.alreadyAttempted) {
                setAlreadyAttempted(true);
                setAttempt(res.data.attempt);
            } else {
                setTestToken(res.data.token);
                setTest(res.data.data);
            }
        } catch (error: any) {
            setAuthError(error.response?.data?.error || 'Authentication failed');
        } finally {
            setAuthenticating(false);
        }
    };

    const handleStartTest = () => {
        if (testToken) {
            // Store token and test data for test player
            localStorage.setItem(`test_token_${slug}`, testToken);
            localStorage.setItem(`test_data_${slug}`, JSON.stringify(test));
        }
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

    // Show login form for password-based tests
    if (test && !test.requiresAccountLogin && !testToken) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">{test.title}</CardTitle>
                        <p className="text-muted-foreground">Enter your credentials to access the test</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordAuth} className="space-y-4">
                            {authError && (
                                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                    {authError}
                                </div>
                            )}

                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password from email"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Check your email for the password
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={authenticating}>
                                {authenticating ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Access Test
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!test) return null;

    // Show test details (for account-based auth or after password auth)
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
