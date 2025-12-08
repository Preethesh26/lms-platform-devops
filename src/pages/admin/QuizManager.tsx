import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuizManager() {
    const { quizzes, fetchQuizzes, isInitialized } = useStore();

    useEffect(() => {
        if (isInitialized) {
            fetchQuizzes();
        }
    }, [isInitialized]);

    if (!isInitialized) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quiz Management</h2>
                    <p className="text-muted-foreground">Create and manage your quizzes here</p>
                </div>
                <Link to="/admin/quizzes/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed rounded-lg p-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Quizzes Created</h3>
                    <p className="mb-4">Get started by creating your first quiz.</p>
                    <Link to="/admin/quizzes/create">
                        <Button variant="outline">Create Quiz</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((quiz: any) => (
                        <Card key={quiz._id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {quiz.course?.title || 'Unknown Course'}
                                </CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-2">{quiz.title}</div>
                                <div className="text-xs text-muted-foreground flex flex-col gap-1">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {quiz.timeLimit > 0 ? `${quiz.timeLimit} mins` : 'No time limit'}
                                    </span>
                                    <span>{quiz.questions.length} Questions</span>
                                    <span>Min Score: {quiz.passingScore}%</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
