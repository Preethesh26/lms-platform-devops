import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Link } from "react-router-dom";

export default function MyLearningPage() {
    const { courses, isInitialized, currentUser } = useStore();

    if (!isInitialized) return null;

    if (!currentUser) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Please log in to view your enrolled courses.</p>
                <Link to="/login">
                    <Button className="mt-4">Login</Button>
                </Link>
            </div>
        );
    }

    const enrolledCourses = courses.filter(course => currentUser.enrolledCourses.includes(course.id));

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">My Learning</h2>
            {enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
                    <Link to="/">
                        <Button className="mt-4">Browse Courses</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {enrolledCourses.map((course) => (
                        <Card key={course.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-[0%]"></div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">0% Complete</p>
                            </CardContent>
                            <CardFooter>
                                <Link to={`/courses/${course.id}`} className="w-full">
                                    <Button className="w-full">Continue Learning</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
