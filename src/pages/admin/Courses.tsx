import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Upload, Loader2 } from "lucide-react";
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
import { uploadAPI } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Trash2 } from "lucide-react";

export default function AdminCoursesPage() {
    const navigate = useNavigate();
    const { courses, addCourse, updateCourse, deleteCourse, isInitialized } = useStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [managingCourse, setManagingCourse] = useState<Course | null>(null);
    const [uploading, setUploading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Refs for thumbnail inputs
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const editThumbnailInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Refs for video inputs
    const videoInputRef = useRef<HTMLInputElement>(null);
    const editVideoInputRef = useRef<HTMLInputElement>(null);
    const lessonVideoInputRef = useRef<HTMLInputElement>(null);

    // Upload Targets
    const createVideoFileRef = useRef<HTMLInputElement>(null);
    const editVideoFileRef = useRef<HTMLInputElement>(null);
    const lessonVideoFileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const res = await uploadAPI.upload(formData);
            if (res.data.success) {
                const url = res.data.url;
                if (isEdit && editThumbnailInputRef.current) {
                    editThumbnailInputRef.current.value = url;
                } else if (!isEdit && thumbnailInputRef.current) {
                    thumbnailInputRef.current.value = url;
                }
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            const msg = error.response?.data?.message || error.message || 'Upload failed';
            toast.error(`Upload failed: ${msg}`);
        } finally {
            setUploading(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit' | 'lesson') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // check max size (500MB)
        if (file.size > 500 * 1024 * 1024) {
            toast.error("Video file is too large. Max size is 500MB.");
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        const loadingToast = toast.loading("Uploading video...");

        try {
            const res = await uploadAPI.upload(formData);
            if (res.data.success) {
                const url = res.data.url;

                if (target === 'create' && videoInputRef.current) {
                    videoInputRef.current.value = url;
                    // Trigger duration detection
                    handleVideoUrlBlur({ target: { value: url } } as any);
                } else if (target === 'edit' && editVideoInputRef.current) {
                    editVideoInputRef.current.value = url;
                } else if (target === 'lesson' && lessonVideoInputRef.current) {
                    lessonVideoInputRef.current.value = url;
                    // Trigger duration detection for lesson
                    handleVideoUrlBlur({ target: { value: url } } as any);
                }
                toast.success("Video uploaded successfully!");
            }
        } catch (error: any) {
            console.error('Video upload failed:', error);
            const msg = error.response?.data?.message || error.message || 'Upload failed';
            toast.error(`Upload failed: ${msg}`);
        } finally {
            setUploading(false);
            toast.dismiss(loadingToast);
            // Reset input
            e.target.value = '';
        }
    };

    // ... existing handleCreate ...



    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await addCourse({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                price: Number(formData.get("price")) || 0,
                videoUrl: formData.get("videoUrl") as string,
                thumbnail: formData.get("thumbnail") as string,
                isFeatured: formData.get("isFeatured") === "on",
                lessons: [],
                color: formData.get("color") as string || "#6366f1",
            });
            setIsCreateOpen(false);
            toast.success("Masterclass created successfully!");
        } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to create course. Check console for details.";
            toast.error(msg);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingCourse) return;
        const formData = new FormData(e.currentTarget);

        try {
            await updateCourse(editingCourse.id, {
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                price: Number(formData.get("price")) || 0,
                videoUrl: formData.get("videoUrl") as string,
                thumbnail: formData.get("thumbnail") as string,
                isFeatured: formData.get("isFeatured") === "on",
                color: formData.get("color") as string,
            });
            setEditingCourse(null);
            toast.success("Course details refined!");
        } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to update course.";
            toast.error(msg);
        }
    };

    const [detectingDuration, setDetectingDuration] = useState(false);
    const durationInputRef = useRef<HTMLInputElement>(null);

    const getDurationFromUrl = (url: string): Promise<string> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = url;

            video.onloadedmetadata = () => {
                const totalSeconds = Math.floor(video.duration);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                video.remove();
            };

            video.onerror = () => {
                resolve("");
                video.remove();
            };
        });
    };

    const handleVideoUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const url = e.target.value;
        if (!url || !durationInputRef.current) return;

        // Skip if duration is already set to avoid overwriting manual entry
        if (durationInputRef.current.value) return;

        setDetectingDuration(true);
        const duration = await getDurationFromUrl(url);
        if (duration && durationInputRef.current) {
            durationInputRef.current.value = duration;
            toast.success(`Duration detected: ${duration}`);
        } else {
            // Optional: toast.error("Could not auto-detect duration. Please enter manually.");
        }
        setDetectingDuration(false);
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

    const handleDeleteCourse = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteCourse(deleteId);
            toast.success("Course deleted successfully");
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete course");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteLesson = (lessonId: string) => {
        if (!managingCourse) return;
        if (!confirm("Are you sure you want to delete this lesson?")) return;
        const updatedLessons = managingCourse.lessons.filter(l => l.id !== lessonId);
        updateCourse(managingCourse.id, { lessons: updatedLessons });
        setManagingCourse({ ...managingCourse, lessons: updatedLessons });
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Course Vault</h1>
                    <p className="text-muted-foreground font-medium">Manage and refine your educational assets with ease.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 rounded-xl font-bold w-full lg:w-auto bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Create Masterclass
                        </Button>
                    </DialogTrigger>
                    <DialogContent key={isCreateOpen ? 'create' : 'closed'} className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto rounded-[2.5rem] border-2 border-indigo-500/20 dark:border-indigo-500/50 shadow-2xl p-0">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative flex-shrink-0">
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
                                <Label htmlFor="thumbnail" className="text-xs font-bold uppercase tracking-widest opacity-70">Thumbnail Management</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="thumbnail"
                                        name="thumbnail"
                                        ref={thumbnailInputRef}
                                        placeholder="https://images.unsplash.com/..."
                                        className="h-12 rounded-xl flex-1"
                                    />
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleUpload(e, false)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 px-4 rounded-xl border-dashed border-2 hover:bg-muted/50 transition-all font-bold"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium px-1">Upload an image or paste a cloud link manually.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="videoUrl" className="text-xs font-bold uppercase tracking-widest opacity-70">Video Preview (Link or Upload)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="videoUrl"
                                        name="videoUrl"
                                        placeholder="Paste URL or click Upload button"
                                        className="h-12 rounded-xl flex-1"
                                        ref={videoInputRef}
                                    />
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={createVideoFileRef}
                                        accept="video/mp4,video/webm,video/quicktime"
                                        onChange={(e) => handleVideoUpload(e, 'create')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 px-4 rounded-xl border-dashed border-2 hover:bg-muted/50 transition-all font-bold shrink-0"
                                        onClick={() => createVideoFileRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        {uploading ? "Uploading..." : "Upload"}
                                    </Button>
                                </div>
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
                    <Card className="col-span-full py-20 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem]">
                        <CardContent className="space-y-4">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <Plus className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xl font-black text-slate-900 dark:text-white">No courses yet</p>
                                <p className="text-muted-foreground font-medium">Start by creating your first masterclass.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    courses.map((course) => (
                        <Card
                            key={course.id}
                            className="group overflow-hidden rounded-[2.5rem] border-2 border-transparent dark:bg-slate-900/50 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all hover:-translate-y-2 bg-white dark:hover:border-primary/20 relative"
                        >
                            <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${course.color}15` }}>
                                        <div className="p-4 rounded-xl backdrop-blur-md bg-white/30 dark:bg-black/30">
                                            <Sparkles className="w-8 h-8 opacity-50" style={{ color: course.color }} />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm text-[10px] font-black uppercase tracking-widest text-primary border border-white/20 dark:border-white/10">
                                        ₹{course.price}
                                    </div>
                                    {course.isFeatured && (
                                        <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-amber-950 shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-300">
                                            <Sparkles className="w-3 h-3 fill-amber-950" /> Featured
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center gap-3">
                                    <Button
                                        size="sm"
                                        className="rounded-xl font-bold h-10 px-5 bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
                                        onClick={() => setEditingCourse(course)}
                                    >
                                        Edit Details
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="rounded-xl font-bold h-10 px-5 bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
                                        onClick={() => setManagingCourse(course)}
                                    >
                                        Manage Curriculum
                                    </Button>
                                </div>
                            </div>
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1 text-slate-900 dark:text-white">
                                    {course.title}
                                </CardTitle>
                                <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed h-[40px]">
                                    {course.description}
                                </p>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-0 flex items-center justify-between border-t border-dashed border-slate-100 dark:border-slate-800 mt-auto">
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style={{ backgroundColor: `${course.color}15`, color: course.color }}>
                                        {course.lessons?.length || 0}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Lessons</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-4 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold transition-all"
                                    onClick={() => setDeleteId(course.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Course Dialog */}
            <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogContent key={editingCourse?.id || 'edit'} className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto rounded-[2.5rem] border-2 border-indigo-500/20 dark:border-indigo-500/50 shadow-2xl p-0">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white relative flex-shrink-0">
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
                            <Label htmlFor="edit-thumbnail" className="text-xs font-bold uppercase tracking-widest opacity-70">Thumbnail Management</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="edit-thumbnail"
                                    name="thumbnail"
                                    defaultValue={editingCourse?.thumbnail}
                                    ref={editThumbnailInputRef}
                                    placeholder="https://images.unsplash.com/..."
                                    className="h-12 rounded-xl flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 px-4 rounded-xl border-dashed border-2 hover:bg-muted/50 transition-all font-bold"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium px-1">You can upload a new one or keep the existing link.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-videoUrl" className="text-xs font-bold uppercase tracking-widest opacity-70">Video Preview (Link or Upload)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="edit-videoUrl"
                                    name="videoUrl"
                                    defaultValue={editingCourse?.videoUrl}
                                    placeholder="Paste URL or click Upload button"
                                    className="h-12 rounded-xl flex-1"
                                    ref={editVideoInputRef}
                                />
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={editVideoFileRef}
                                    accept="video/mp4,video/webm,video/quicktime"
                                    onChange={(e) => handleVideoUpload(e, 'edit')}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 px-4 rounded-xl border-dashed border-2 hover:bg-muted/50 transition-all font-bold shrink-0"
                                    onClick={() => editVideoFileRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {uploading ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
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
                                        <Label htmlFor="videoUrl">Video Source</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="videoUrl"
                                                name="videoUrl"
                                                placeholder="Paste YouTube link or Upload Video File"
                                                required
                                                onBlur={handleVideoUrlBlur}
                                                ref={lessonVideoInputRef}
                                                className="flex-1"
                                            />
                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={lessonVideoFileRef}
                                                accept="video/mp4,video/webm,video/quicktime"
                                                onChange={(e) => handleVideoUpload(e, 'lesson')}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="default"
                                                className="h-10 px-3 border-dashed border-2 hover:bg-muted/50 shrink-0"
                                                onClick={() => lessonVideoFileRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                                Upload
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">Duration</Label>
                                        <div className="relative">
                                            <Input
                                                id="duration"
                                                name="duration"
                                                placeholder="e.g. 10:30 (Optional)"
                                                ref={durationInputRef}
                                                className={detectingDuration ? "opacity-50" : ""}
                                            />
                                            {detectingDuration && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
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

            <DeleteConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteCourse}
                loading={isDeleting}
                title="Delete Course"
                description="Are you sure you want to delete this course? This action is permanent and will remove all associated lessons and student progress."
            />
        </div>
    );
}
