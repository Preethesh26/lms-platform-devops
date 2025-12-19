import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aiAPI } from '@/lib/api';
import { Bot, Send, User, X, Loader2, Sparkles } from 'lucide-react';

interface AIChatSidebarProps {
    courseId: string;
    lessonId: string;
    lessonTitle: string;
    onClose: () => void;
}

interface Message {
    role: 'bot' | 'user';
    content: string;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
    courseId,
    lessonId,
    lessonTitle,
    onClose
}) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: `Hi! I'm your AI tutor. Ask me anything about the lesson: "${lessonTitle}"` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await aiAPI.chat({ courseId, lessonId, question: userMsg });
            setMessages(prev => [...prev, { role: 'bot', content: res.data.data }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col border-l rounded-none shadow-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base">AI Tutor</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Contextual Assistant</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
                                {msg.role === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted/50 border rounded-tl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-muted/50 border p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-xs text-muted-foreground italic">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <div className="p-4 border-t bg-muted/20">
                <div className="relative flex items-center">
                    <Input
                        placeholder="Ask about this lesson..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="pr-12 bg-background border-primary/20 focus-visible:ring-primary/30"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSend}
                        className="absolute right-1 text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8"
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-muted-foreground">Powered by Gemini AI</span>
                </div>
            </div>
        </Card>
    );
};
