import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, DollarSign } from "lucide-react";

type DashboardStatsProps = {
    stats: {
        totalUsers: number;
        totalCourses: number;
        totalEnrollments: number;
        totalRevenue: number;
    } | null;
    loading: boolean;
};

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
    if (loading) {
        return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-muted/20 dark:bg-slate-900/50 animate-pulse rounded-[2.5rem] border-2 border-dashed border-muted"></div>
            ))}
        </div>;
    }

    if (!stats) return null;

    const items = [
        {
            title: "Total Students",
            value: stats.totalUsers,
            icon: Users,
            description: "Active learners on platform",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            trend: "+12%"
        },
        {
            title: "Total Courses",
            value: stats.totalCourses,
            icon: BookOpen,
            description: "Published and active courses",
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-950/30",
            trend: "+3"
        },
        {
            title: "Total Enrollments",
            value: stats.totalEnrollments,
            icon: GraduationCap,
            description: "Course registrations",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            trend: "+8%"
        },
        {
            title: "Total Revenue",
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            description: "Estimated earnings",
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
            trend: "₹2.4k"
        }
    ];

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
                <Card key={index} className="group border-2 border-transparent dark:bg-slate-900/50 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all hover:-translate-y-2 rounded-[2.5rem] overflow-hidden bg-white dark:hover:border-primary/20 relative">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                            {item.trend}
                        </div>
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-8 pt-8">
                        <div className={`p-4 rounded-2xl ${item.bg} transition-transform group-hover:scale-110 duration-500`}>
                            <item.icon className={`h-6 w-6 ${item.color}`} strokeWidth={2.5} />
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-4">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                            {item.title}
                        </CardTitle>
                        <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                            {item.value}
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                            <span className="w-3 h-[1px] bg-slate-200 dark:bg-slate-700"></span>
                            {item.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
