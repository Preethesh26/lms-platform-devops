import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useStore, type Course } from "@/lib/store";

export default function AdminCoursesPage() {
    const navigate = useNavigate();
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
            price: Number(formData.get("price")) || 0,
            videoUrl: formData.get("videoUrl") as string,
            thumbnail: formData.get("thumbnail") as string,
            isFeatured: formData.get("isFeatured") === "on",
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
            price: Number(formData.get("price")) || 0,
            videoUrl: formData.get("videoUrl") as string,
            thumbnail: formData.get("thumbnail") as string,
            isFeatured: formData.get("isFeatured") === "on",
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold tracking-tight">Access Course Vault</h2>
                    <p className="text-muted-foreground font-medium">Manage and refine your educational assets with ease.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Create Masterclass
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Plus className="w-24 h-24" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Course Offering</DialogTitle>
                                <DialogDescription className="text-indigo-100 font-medium">
                                    Fill in the details below to launch your new course.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest opacity-70">Course Title</Label>
                                <Input id="title" name="title" placeholder="Mastering the Digital Arts" className="h-12 rounded-xl" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest opacity-70">Overview</Label>
                                <textarea id="description" name="description" className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Describe the journey..." required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest opacity-70">Price (₹)</Label>
                                    <Input id="price" name="price" type="number" placeholder="499" className="h-12 rounded-xl" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color" className="text-xs font-bold uppercase tracking-widest opacity-70">Brand Color</Label>
                                    <Input id="color" name="color" type="color" defaultValue="#6366f1" className="h-12 w-full p-1 rounded-xl cursor-pointer" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="thumbnail" className="text-xs font-bold uppercase tracking-widest opacity-70">Thumbnail URL</Label>
                                <Input id="thumbnail" name="thumbnail" placeholder="https://images.unsplash.com/..." className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="videoUrl" className="text-xs font-bold uppercase tracking-widest opacity-70">Preview Video URL</Label>
                                <Input id="videoUrl" name="videoUrl" placeholder="https://youtube.com/..." className="h-12 rounded-xl" />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-2xl border border-border/50">
                                <Switch id="isFeatured" name="isFeatured" />
                                <div className="space-y-0.5">
                                    <Label htmlFor="isFeatured" className="text-sm font-bold">Feature on Homepage</Label>
                                    <p className="text-xs text-muted-foreground">This course will appear in the 'Featured' section of the landing page.</p>
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" className="h-12 w-full sm:w-auto px-8 rounded-xl font-bold shadow-lg shadow-primary/10">Publish Course</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {courses.length === 0 ? (
                    <Card className="col-span-full py-20 text-center border-dashed border-2 bg-muted/20 rounded-[2.5rem]">
                        <CardContent className="space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-40">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold">No courses yet</p>
                                <p className="text-muted-foreground">Start by creating your first masterclass.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    courses.map((course) => (
                        <Card
                            key={course.id}
                            className="group overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-white relative"
                        >
                            <div className="aspect-video relative overflow-hidden bg-muted">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${course.color}20` }}>
                                        <Plus className="w-10 h-10 opacity-20" style={{ color: course.color }} />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur shadow-sm text-[10px] font-bold uppercase tracking-wider text-primary">
                                        ₹{course.price}
                                    </div>
                                    {course.isFeatured && (
                                        <div className="px-3 py-1.5 rounded-full bg-amber-400 text-white shadow-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" /> Featured
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="rounded-xl font-bold h-9 px-4"
                                        onClick={() => setEditingCourse(course)}
                                    >
                                        Edit Details
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="rounded-xl font-bold h-9 px-4"
                                        onClick={() => setManagingCourse(course)}
                                    >
                                        Manage Curriculum
                                    </Button>
                                </div>
                            </div>
                            <CardHeader className="p-6">
                                <CardTitle className="text-xl font-extrabold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                    {course.title}
                                </CardTitle>
                                <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed h-[40px]">
                                    {course.description}
                                </p>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-border/30 mt-auto">
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${course.color}15`, color: course.color }}>
                                        {course.lessons?.length || 0}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lessons</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-4 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                                    onClick={() => deleteCourse(course.id)}
                                >
                                    Remove
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Course Dialog */}
            <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Plus className="w-24 h-24 rotate-45" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Edit Masterclass Info</DialogTitle>
                            <DialogDescription className="text-indigo-100 font-medium">
                                Refine the details for "{editingCourse?.title}"
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleUpdate} className="p-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-xs font-bold uppercase tracking-widest opacity-70">Course Title</Label>
                            <Input id="edit-title" name="title" defaultValue={editingCourse?.title} className="h-12 rounded-xl" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-widest opacity-70">Overview</Label>
                            <textarea id="edit-description" name="description" defaultValue={editingCourse?.description} className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-price" className="text-xs font-bold uppercase tracking-widest opacity-70">Price (₹)</Label>
                                <Input id="edit-price" name="price" type="number" defaultValue={editingCourse?.price} className="h-12 rounded-xl" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-color" className="text-xs font-bold uppercase tracking-widest opacity-70">Brand Color</Label>
                                <Input id="edit-color" name="color" type="color" defaultValue={editingCourse?.color} className="h-12 w-full p-1 rounded-xl cursor-pointer" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-thumbnail" className="text-xs font-bold uppercase tracking-widest opacity-70">Thumbnail URL</Label>
                            <Input id="edit-thumbnail" name="thumbnail" defaultValue={editingCourse?.thumbnail} placeholder="https://images.unsplash.com/..." className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-videoUrl" className="text-xs font-bold uppercase tracking-widest opacity-70">Preview Video URL</Label>
                            <Input id="edit-videoUrl" name="videoUrl" defaultValue={editingCourse?.videoUrl} className="h-12 rounded-xl" />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-2xl border border-border/50">
                            <Switch id="edit-isFeatured" name="isFeatured" defaultChecked={editingCourse?.isFeatured} />
                            <div className="space-y-0.5">
                                <Label htmlFor="edit-isFeatured" className="text-sm font-bold">Feature on Homepage</Label>
                                <p className="text-xs text-muted-foreground">This course will appear in the 'Featured' section.</p>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="h-12 w-full sm:w-auto px-8 rounded-xl font-bold shadow-lg shadow-primary/10">Save Refinements</Button>
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
