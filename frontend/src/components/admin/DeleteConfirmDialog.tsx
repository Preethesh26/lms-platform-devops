import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    loading?: boolean;
}

export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    loading = false
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-center">{title}</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex sm:justify-center gap-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl font-bold px-6 border border-slate-200 dark:border-slate-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-xl font-bold px-6 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
