import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Upload, Copy, CheckCircle, XCircle } from 'lucide-react';
import { testsAPI } from '@/lib/api';

export default function TestInvitations() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchTest();
        fetchStats();
    }, [id]);

    const fetchTest = async () => {
        try {
            const res = await testsAPI.getOne(id!);
            setTest(res.data.data);
        } catch (error) {
            console.error('Error fetching test:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await testsAPI.getStats(id!);
            setStats(res.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleAddEmail = async () => {
        if (!email || !test) return;

        try {
            const updatedInvited = [...test.invitedUsers, { email: email.toLowerCase() }];
            await testsAPI.update(id!, { invitedUsers: updatedInvited });
            setEmail('');
            fetchTest();
            fetchStats();
        } catch (error) {
            console.error('Error adding email:', error);
        }
    };

    const handleRemoveEmail = async (emailToRemove: string) => {
        if (!test) return;

        try {
            const updatedInvited = test.invitedUsers.filter((u: any) => u.email !== emailToRemove);
            await testsAPI.update(id!, { invitedUsers: updatedInvited });
            fetchTest();
            fetchStats();
        } catch (error) {
            console.error('Error removing email:', error);
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/test/${test.accessSlug}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading || !test) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    const testLink = `${window.location.origin}/test/${test.accessSlug}`;

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/tests')} className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tests
            </button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
                <p className="text-muted-foreground">Manage test invitations</p>
            </div>

            {/* Test Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Access Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input value={testLink} readOnly className="flex-1" />
                        <Button onClick={copyLink} variant="outline">
                            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Share this link with invited users. They must be logged in to access.
                    </p>
                </CardContent>
            </Card>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.totalInvited}</div>
                            <div className="text-sm text-muted-foreground">Total Invited</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                            <div className="text-sm text-muted-foreground">Passed</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Email */}
            <Card>
                <CardHeader>
                    <CardTitle>Add User</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                        />
                        <Button onClick={handleAddEmail}>
                            <Mail className="h-4 w-4 mr-2" />
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Invited Users List */}
            <Card>
                <CardHeader>
                    <CardTitle>Invited Users ({test.invitedUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {test.invitedUsers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No users invited yet</p>
                    ) : (
                        <div className="space-y-2">
                            {test.invitedUsers.map((user: any, idx: number) => {
                                const attempt = stats?.attempts?.find((a: any) => a.user.email === user.email);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {attempt ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-gray-400" />
                                            )}
                                            <div>
                                                <div className="font-medium">{user.email}</div>
                                                {attempt && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Score: {attempt.score}/{attempt.maxScore} ({attempt.percentage.toFixed(0)}%) - {attempt.passed ? 'Passed' : 'Failed'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveEmail(user.email)}
                                            className="text-red-600"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
