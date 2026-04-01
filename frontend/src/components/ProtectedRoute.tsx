// ============================================================
// PROTECTED ROUTE COMPONENT
// Blocks access to admin routes if user is not logged in
// or does not have the required role.
//
// Usage in App.tsx:
//   <ProtectedRoute roles={['admin', 'superadmin']}>
//     <AdminLayout />
//   </ProtectedRoute>
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles: string[];           // allowed roles e.g. ['admin', 'superadmin']
    redirectTo?: string;       // where to redirect if not authorized
}

export default function ProtectedRoute({
    children,
    roles,
    redirectTo = '/admin/login'
}: ProtectedRouteProps) {
    const { currentUser, isInitialized } = useStore();
    const location = useLocation();

    // Still loading — show spinner, don't redirect yet
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    // Not logged in → redirect to login, remember where they were trying to go
    if (!currentUser) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Logged in but wrong role → redirect to login
    if (!roles.includes(currentUser.role)) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // All good — render the protected content
    return <>{children}</>;
}
