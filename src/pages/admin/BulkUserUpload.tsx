import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usersAPI } from '@/lib/api';

export default function BulkUserUpload() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await usersAPI.bulkUpload(formData);
            setResult(res.data);
            setFile(null);
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Upload failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = `name,email,enrollment,role,password
John Doe,john.doe@example.com,ENR-2025-00001,user,password123
Jane Smith,jane.smith@example.com,,user,
Admin User,admin@example.com,ADMIN-001,admin,admin123`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user-upload-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/admin/users')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Users
                </Button>
            </div>

            <div>
                <h2 className="text-3xl font-bold tracking-tight">Bulk User Upload</h2>
                <p className="text-muted-foreground">Upload a CSV file to create multiple users at once</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload CSV File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={downloadTemplate}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                    </div>

                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload">
                            <Button variant="outline" type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                                Choose CSV File
                            </Button>
                        </label>
                        {file && (
                            <p className="mt-4 text-sm text-muted-foreground">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    {file && (
                        <Button onClick={handleUpload} disabled={uploading} className="w-full">
                            {uploading ? 'Uploading...' : 'Upload and Create Users'}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {result.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            {result.message}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result.success && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{result.created}</div>
                                    <div className="text-sm text-muted-foreground">Created</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                                    <div className="text-sm text-muted-foreground">Skipped</div>
                                </div>
                                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                                    <div className="text-sm text-muted-foreground">Errors</div>
                                </div>
                            </div>
                        )}

                        {result.details?.createdUsers?.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Created Users ({result.details.createdUsers.length})
                                </h4>
                                <div className="max-h-48 overflow-y-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-2 text-left">Name</th>
                                                <th className="p-2 text-left">Email</th>
                                                <th className="p-2 text-left">Enrollment</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.details.createdUsers.map((user: any, idx: number) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-2">{user.name}</td>
                                                    <td className="p-2">{user.email}</td>
                                                    <td className="p-2">{user.enrollment}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {result.details?.skippedUsers?.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    Skipped Users ({result.details.skippedUsers.length})
                                </h4>
                                <div className="max-h-48 overflow-y-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-2 text-left">Email</th>
                                                <th className="p-2 text-left">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.details.skippedUsers.map((user: any, idx: number) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-2">{user.email}</td>
                                                    <td className="p-2">{user.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {result.details?.errors?.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    Errors ({result.details.errors.length})
                                </h4>
                                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-red-50 dark:bg-red-950">
                                    {result.details.errors.map((err: any, idx: number) => (
                                        <div key={idx} className="text-sm text-red-600 mb-1">
                                            Line {err.line}: {err.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
