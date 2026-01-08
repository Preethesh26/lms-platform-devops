import { Plus, BookOpen, Clock, Loader2, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { toast } from "sonner";

export default function QuizManager() {
    const { quizzes, fetchQuizzes, deleteQuiz, isInitialized, isDemoMode } = useStore();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isInitialized) {
            fetchQuizzes();
        }
    }, [isInitialized]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteQuiz(deleteId);
            toast.success("Quiz deleted successfully");
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete quiz");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isInitialized) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quiz Management</h2>
                    <p className="text-muted-foreground">Create and manage your quizzes here</p>
                </div>
                <Link to={`${isDemoMode ? '/demo' : '/admin'}/quizzes/create`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                    <BookOpen className="h-10 w-10 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No Quizzes Created</h3>
                    <p className="mb-6 max-w-sm mx-auto">Get started by creating your first course-specific quiz.</p>
                    <Link to={`${isDemoMode ? '/demo' : '/admin'}/quizzes/create`}>
                        <Button className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">Create Quiz</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {quizzes.map((quiz: any) => (
                        <Card key={quiz._id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all hover:-translate-y-1 dark:bg-slate-900/50 rounded-[2rem] border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 overflow-hidden relative">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    {quiz.course?.title || 'Standalone Quiz'}
                                </CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2">
                                <div className="text-lg font-black mb-1 line-clamp-1 text-slate-900 dark:text-white" title={quiz.title}>{quiz.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 opacity-70" />
                                        {quiz.timeLimit > 0 ? `${quiz.timeLimit} mins` : 'No time limit'}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>{quiz.questions.length} Questions</span>
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Pass: {quiz.passingScore}%</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Link to={`${isDemoMode ? '/demo' : '/admin'}/quizzes/${quiz._id}/edit`}>
                                        <Button variant="outline" size="sm" className="w-full rounded-xl font-bold">
                                            <Edit className="h-3.5 w-3.5 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-xl font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => setDeleteId(quiz._id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <DeleteConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                loading={isDeleting}
                title="Delete Quiz"
                description="Are you sure you want to delete this quiz? This will also remove it from the associated course lessons and delete all student attempts."
            />
        </div>
    );
}
