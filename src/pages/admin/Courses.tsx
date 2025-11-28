import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, type Course } from "@/lib/store";

export default function AdminCoursesPage() {
    const { courses, addCourse, updateCourse, deleteCourse, isInitialized } = useStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [managingCourse, setManagingCourse] = useState<Course | null>(null);

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        addCourse({
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            price: formData.get("price") as string,
            videoUrl: formData.get("videoUrl") as string,
            lessons: [],
            color: "bg-blue-500/10 text-blue-500", // Default color for now
        });
        setIsCreateOpen(false);
    };

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingCourse) return;
        const formData = new FormData(e.currentTarget);
        updateCourse(editingCourse.id, {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            price: formData.get("price") as string,
            videoUrl: formData.get("videoUrl") as string,
        });
        setEditingCourse(null);
    };

    const handleAddLesson = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!managingCourse) return;
        const formData = new FormData(e.currentTarget);
        const newLesson = {
            id: Math.random().toString(36).substr(2, 9),
            title: formData.get("lessonTitle") as string,
            videoUrl: formData.get("videoUrl") as string,
            duration: formData.get("duration") as string,
        };

        const updatedLessons = [...managingCourse.lessons, newLesson];
        updateCourse(managingCourse.id, { lessons: updatedLessons });

        // Update local state to reflect changes immediately in the dialog
        setManagingCourse({ ...managingCourse, lessons: updatedLessons });

        // Reset form
        e.currentTarget.reset();
    };

    const handleDeleteLesson = (lessonId: string) => {
        if (!managingCourse) return;
        const updatedLessons = managingCourse.lessons.filter(l => l.id !== lessonId);
        updateCourse(managingCourse.id, { lessons: updatedLessons });
        setManagingCourse({ ...managingCourse, lessons: updatedLessons });
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Create Course</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Course</DialogTitle>
                            <DialogDescription>Add a new course to the platform.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" name="description" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input id="price" name="price" defaultValue="$49.99" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="videoUrl">Preview Video URL (YouTube)</Label>
                                    <Input id="videoUrl" name="videoUrl" placeholder="https://youtube.com/..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Course</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {courses.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">No courses found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    courses.map((course) => (
                        <Card key={course.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {course.title}
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setEditingCourse(course)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => deleteCourse(course.id)}>Delete</Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{course.description}</p>
                                <div className="mt-2 flex gap-4 text-sm">
                                    <span className="font-medium">{course.price}</span>
                                    <span className="text-muted-foreground">{course.lessons.length} Lessons</span>
                                </div>
                                <Button className="w-full mt-4" variant="secondary" onClick={() => setManagingCourse(course)}>
                                    Manage Content
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" defaultValue={editingCourse?.title} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" defaultValue={editingCourse?.description} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <Input id="price" name="price" defaultValue={editingCourse?.price} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-videoUrl">Preview Video URL (YouTube)</Label>
                                <Input id="edit-videoUrl" name="videoUrl" defaultValue={editingCourse?.videoUrl} placeholder="https://youtube.com/..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Content Dialog */}
            <Dialog open={!!managingCourse} onOpenChange={(open) => !open && setManagingCourse(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Content: {managingCourse?.title}</DialogTitle>
                        <DialogDescription>Add and manage lessons for this course.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Add New Lesson Form */}
                        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                            <h4 className="font-medium text-sm">Add New Lesson</h4>
                            <form onSubmit={handleAddLesson} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="lessonTitle">Lesson Title</Label>
                                    <Input id="lessonTitle" name="lessonTitle" placeholder="e.g. Introduction to React" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="videoUrl">Video URL</Label>
                                        <Input id="videoUrl" name="videoUrl" placeholder="YouTube or MP4 link" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">Duration</Label>
                                        <Input id="duration" name="duration" placeholder="e.g. 10:30" required />
                                    </div>
                                </div>
                                <Button type="submit" size="sm">Add Lesson</Button>
                            </form>
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Lessons ({managingCourse?.lessons.length})</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {managingCourse?.lessons.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No lessons added yet.</p>
                                ) : (
                                    managingCourse?.lessons.map((lesson, index) => (
                                        <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{lesson.title}</p>
                                                    <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLesson(lesson.id)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
