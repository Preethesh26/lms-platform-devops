import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import axios from "axios";
import { useStore } from "@/lib/store";
import { MOCK_STATS, MOCK_CHARTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Users, BookOpen, GraduationCap, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
    const { currentUser, isDemoMode } = useStore();
    const token = localStorage.getItem('token');
    const currentPrefix = isDemoMode ? '/demo' : '/admin';
    const [stats, setStats] = useState(null);
    const [chartsData, setChartsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnalytics = async () => {
            // Check for demo admin - Use mock data instead of real API
            if (isDemoMode) {
                setStats(MOCK_STATS as any);
                setChartsData(MOCK_CHARTS as any);
                setLoading(false);
                return;
            }

            try {
                // Only show loading on initial fetch
                if (!stats) setLoading(true);
                const headers = { Authorization: `Bearer ${token}` };

                const [statsRes, growthRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/analytics/stats`, { headers }),
                    axios.get(`${import.meta.env.VITE_API_URL}/analytics/growth`, { headers })
                ]);

                setStats(statsRes.data.data);
                setChartsData(growthRes.data.data);
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAnalytics();

            // Automatic refresh every 30 seconds
            const interval = setInterval(fetchAnalytics, 30000);
            return () => clearInterval(interval);
        }
    }, [token, stats, currentUser]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] opacity-80">
                        <span className="w-8 h-[2px] bg-primary rounded-full"></span>
                        Admin Dashboard
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        {getGreeting()}, <span className="text-primary">{currentUser?.name?.split('  ') || 'Admin'}</span>.
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base max-w-2xl">
                        Here's a strategic overview of your platform's growth and student engagement for today.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link to={`${currentPrefix}/courses`}>
                        <Button className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 gap-2">
                            <Plus className="w-5 h-5" />
                            Create Course
                        </Button>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 font-bold flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    {error}
                </div>
            )}

            {/* Quick Stats Grid */}
            <DashboardStats stats={stats} loading={loading} />

            {/* Analytics Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Intelligence Trends</h2>
                        <p className="text-sm text-muted-foreground font-medium">Deep dive into user acquisition and revenue scaling.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold text-xs gap-2 group">
                        Full Report
                        <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Button>
                </div>
                <AnalyticsCharts data={chartsData} loading={loading} />
            </div>
        </div>
    );
}
