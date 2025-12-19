import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Loader2, Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supportAPI } from '@/lib/api';

interface Ticket {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    createdAt: string;
}

export default function SupportInbox() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await supportAPI.getTickets();
            setTickets(res.data.data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdating(true);
        try {
            await supportAPI.updateTicket(id, { status });
            setTickets(tickets.map(t => t._id === id ? { ...t, status: status as any } : t));
            if (selectedTicket?._id === id) {
                setSelectedTicket({ ...selectedTicket, status: status as any });
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Open':
                return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Open</Badge>;
            case 'In Progress':
                return <Badge variant="outline" className="text-blue-500 border-blue-500 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
            case 'Resolved':
                return <Badge variant="secondary" className="bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Resolved</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support Inbox</h1>
                    <p className="text-muted-foreground">Manage and respond to user inquiries</p>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500" /> {tickets.filter(t => t.status === 'Open').length} Open
                    </div>
                    <div className="flex items-center gap-1 border-l pl-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" /> {tickets.filter(t => t.status === 'Resolved').length} Resolved
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tickets</CardTitle>
                    <CardDescription>Recent messages from users</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No support tickets found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => (
                                    <TableRow key={ticket._id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTicket(ticket)}>
                                        <TableCell className="text-sm">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{ticket.name}</div>
                                            <div className="text-xs text-muted-foreground">{ticket.email}</div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {ticket.subject}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(ticket.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between mb-2">
                                    {getStatusBadge(selectedTicket.status)}
                                    <span className="text-xs text-muted-foreground">
                                        Sent on {new Date(selectedTicket.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 pt-2 text-primary">
                                    <Mail className="h-4 w-4" />
                                    {selectedTicket.name} ({selectedTicket.email})
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 border-y my-4 bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
                                {selectedTicket.message}
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <div className="flex gap-2 mr-auto">
                                    {selectedTicket.status !== 'Resolved' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUpdateStatus(selectedTicket._id, 'In Progress')}
                                                disabled={updating || selectedTicket.status === 'In Progress'}
                                            >
                                                Mark In Progress
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleUpdateStatus(selectedTicket._id, 'Resolved')}
                                                disabled={updating}
                                            >
                                                Mark Resolved
                                            </Button>
                                        </>
                                    )}
                                    {selectedTicket.status === 'Resolved' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUpdateStatus(selectedTicket._id, 'Open')}
                                            disabled={updating}
                                        >
                                            Reopen Ticket
                                        </Button>
                                    )}
                                </div>
                                <Button variant="secondary" onClick={() => setSelectedTicket(null)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
