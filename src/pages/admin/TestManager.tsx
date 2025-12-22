import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Users, CheckCircle, Clock, Loader2, Edit } from 'lucide-react';
import { testsAPI } from '@/lib/api';

export default function TestManager() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await testsAPI.getAll();
            setTests(res.data.data);
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (id: string) => {
        try {
            await testsAPI.togglePublish(id);
            fetchTests();
        } catch (error) {
            console.error('Error toggling publish:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this test?')) return;

        try {
            await testsAPI.delete(id);
            fetchTests();
        } catch (error) {
            console.error('Error deleting test:', error);
        }
    };

    const handleExportResults = async (testId: string, testTitle: string) => {
        try {
            const res = await testsAPI.getAttempts(testId);
            const attempts = res.data.data;

            if (attempts.length === 0) {
                alert('No attempts found to export');
                return;
            }

            // CSV Header
            const headers = ['User Name', 'Email', 'Enrollment', 'Score', 'Max Score', 'Percentage', 'Status', 'Completed At'];

            // CSV Rows
            const rows = attempts.map((attempt: any) => {
                const user = attempt.user || {};
                const name = user.name || (attempt.userEmail ? 'Guest' : 'Unknown');
                const email = user.email || attempt.userEmail || 'N/A';
                const enrollment = user.enrollment || 'N/A';
                const percentage = Math.round((attempt.score / attempt.maxScore) * 100);
                const status = percentage >= 70 ? 'Passed' : 'Failed'; // Assuming 70% passing, ideally fetch from test
                const date = new Date(attempt.completedAt).toLocaleString();

                // Handle CSV escaping
                const escape = (text: string) => `"${String(text).replace(/"/g, '""')}"`;

                return [
                    escape(name),
                    escape(email),
                    escape(enrollment),
                    attempt.score,
                    attempt.maxScore,
                    `${percentage}%`,
                    status,
                    escape(date)
                ].join(',');
            });

            // Combine
            const csvContent = [headers.join(','), ...rows].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${testTitle.replace(/[^a-z0-9]/gi, '_')}_results.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting results:', error);
            alert('Failed to export results');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Test Management</h2>
                    <p className="text-muted-foreground">Create and manage standalone tests</p>
                </div>
                <Link to="/admin/tests/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Test
                    </Button>
                </Link>
            </div>

            {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                    <FileText className="h-10 w-10 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No Tests Created</h3>
                    <p className="mb-6 max-w-sm mx-auto">Get started by creating your first standalone test assessment.</p>
                    <Link to="/admin/tests/create">
                        <Button className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">Create Test</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tests.map((test: any) => (
                        <Card key={test._id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all hover:-translate-y-1 dark:bg-slate-900/50 rounded-[2rem] border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 overflow-hidden relative">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                                    {test.isPublished ? (
                                        <span className="text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
                                    ) : (
                                        <span className="text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Draft</span>
                                    )}
                                </CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                    <FileText className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2">
                                <div className="text-lg font-black mb-1 line-clamp-1 text-slate-900 dark:text-white" title={test.title}>{test.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 opacity-70" />
                                        {test.timeLimit > 0 ? `${test.timeLimit} mins` : 'No time limit'}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>{test.questions.length} Questions</span>
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Pass: {test.passingScore}%</span>
                                    </div>
                                </div>

                                {test.stats && (
                                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                            <div className="font-bold text-blue-600">{test.stats.totalInvited}</div>
                                            <div className="text-muted-foreground">Invited</div>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                                            <div className="font-bold text-green-600">{test.stats.completed}</div>
                                            <div className="text-muted-foreground">Completed</div>
                                        </div>
                                        <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                                            <div className="font-bold text-orange-600">{test.stats.pending}</div>
                                            <div className="text-muted-foreground">Pending</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Link to={`/admin/tests/${test._id}/invitations`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Users className="h-3 w-3 mr-1" />
                                            Invitations
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExportResults(test._id, test.title)}
                                        title="Export Results CSV"
                                    >
                                        <FileText className="h-3 w-3" />
                                    </Button>
                                    <Link to={`/admin/tests/${test._id}/edit`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            title="Edit Test"
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTogglePublish(test._id)}
                                    >
                                        {test.isPublished ? 'Unpublish' : 'Publish'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(test._id)}
                                        className="text-red-600"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
