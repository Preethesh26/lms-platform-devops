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
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-24 bg-muted rounded"></div>
                        <div className="h-4 w-4 bg-muted rounded"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-16 bg-muted rounded mb-1"></div>
                        <div className="h-3 w-32 bg-muted rounded"></div>
                    </CardContent>
                </Card>
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
            color: "text-blue-500"
        },
        {
            title: "Total Courses",
            value: stats.totalCourses,
            icon: BookOpen,
            description: "Published and active courses",
            color: "text-purple-500"
        },
        {
            title: "Total Enrollments",
            value: stats.totalEnrollments,
            icon: GraduationCap,
            description: "Course registrations",
            color: "text-green-500"
        },
        {
            title: "Total Revenue",
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            description: "Estimated earnings",
            color: "text-yellow-500"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {item.title}
                        </CardTitle>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
