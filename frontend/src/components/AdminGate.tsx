// ============================================================
// ADMIN GATE COMPONENT
// Hides the admin login page from public access.
// The admin login is only accessible via a secret URL key.
//
// How it works:
//   - /admin/login → shows 404 (not found)
//   - /admin/login?key=ADMIN_SECRET_KEY → shows the real login page
//
// The secret key is set in frontend/.env as VITE_ADMIN_KEY
// Change it to something only you know.
// ============================================================

import { useSearchParams } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

interface AdminGateProps {
    children: React.ReactNode;
}

// Secret key — set VITE_ADMIN_KEY in frontend/.env
// e.g. VITE_ADMIN_KEY=mySecretKey123
// Access via: /admin/login?key=mySecretKey123
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'academypro-admin';

export default function AdminGate({ children }: AdminGateProps) {
    const [searchParams] = useSearchParams();
    const key = searchParams.get('key');

    // If no key or wrong key → show 404, not the login page
    if (key !== ADMIN_KEY) {
        return <NotFound />;
    }

    return <>{children}</>;
}
