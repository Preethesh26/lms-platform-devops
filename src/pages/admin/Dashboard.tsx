import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import axios from "axios";
import { useStore } from "@/lib/store";

export default function AdminDashboardPage() {
    const { currentUser } = useStore();
    const token = localStorage.getItem('token');
    const [stats, setStats] = useState(null);
    const [chartsData, setChartsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
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
        }
    }, [token]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Intelligence Overview</h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base">Platform performance and student growth metrics at a glance.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <DashboardStats stats={stats} loading={loading} />

            <AnalyticsCharts data={chartsData} loading={loading} />
        </div>
    );
}
