import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface TakeTestDialogProps {
    children: React.ReactNode;
}

export function TakeTestDialog({ children }: TakeTestDialogProps) {
    const navigate = useNavigate();
    const [testCode, setTestCode] = useState('');
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (testCode.trim()) {
            setOpen(false);
            // Navigate to the test access page using the slug/code
            navigate(`/test/${testCode.trim()}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Take a Test</DialogTitle>
                    <DialogDescription>
                        Enter the test code provided in your invitation email to access the test.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="testCode">Test Code</Label>
                        <Input
                            id="testCode"
                            placeholder="e.g. advanced-react-quiz-123"
                            value={testCode}
                            onChange={(e) => setTestCode(e.target.value)}
                            required
                        />
                        <p className="text-sm text-muted-foreground">
                            This is usually the last part of the test link.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!testCode.trim()}>
                            Go to Test <Keyboard className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
