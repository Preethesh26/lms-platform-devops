// ============================================================
// SUPER ADMIN — OVERVIEW / DASHBOARD
// High-level stats across all organizations
// ============================================================

import { useState, useEffect } from 'react';
import { Building2, Users, BookOpen, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getOrganizations } from '@/lib/superAdminApi';

interface Org {
    _id: string;
    organizationId: string;
    name: string;
    adminEmail: string;
    isActive: boolean;
    createdAt: string;
    stats: { userCount: number; courseCount: number };
}

export default function SuperAdminOverview() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getOrganizations()
            .then(res => setOrgs(res.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const totalUsers = orgs.reduce((a, o) => a + (o.stats?.userCount || 0), 0);
    const totalCourses = orgs.reduce((a, o) => a + (o.stats?.courseCount || 0), 0);
    const activeOrgs = orgs.filter(o => o.isActive).length;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-white text-2xl font-bold">Platform Overview</h1>
                <p className="text-slate-500 text-sm mt-1">All organizations across the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Organizations', value: orgs.length, icon: Building2, color: 'text-primary' },
                    { label: 'Active Orgs', value: activeOrgs, icon: Activity, color: 'text-green-400' },
                    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-400' },
                    { label: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'text-purple-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-500 text-xs uppercase tracking-widest">{stat.label}</p>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent orgs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-bold">Recent Organizations</h2>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1"
                        onClick={() => navigate('/superadmin/organizations')}>
                        View all <ArrowRight className="w-3 h-3" />
                    </Button>
                </div>
                <div className="space-y-2">
                    {orgs.slice(0, 5).map(org => (
                        <div key={org._id}
                            onClick={() => navigate('/superadmin/organizations')}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">{org.name}</p>
                                    <p className="text-slate-500 text-xs">{org.organizationId} · {org.adminEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400 text-xs">{org.stats?.userCount || 0} users</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${org.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {org.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
