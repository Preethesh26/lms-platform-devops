import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

type AnalyticsChartsProps = {
    data: {
        userGrowth: Array<{ name: string; users: number }>;
        revenueTrends: Array<{ name: string; revenue: number }>;
        coursePopularity: Array<{ name: string; value: number }>;
    } | null;
    loading: boolean;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsCharts({ data, loading }: AnalyticsChartsProps) {
    if (loading || !data) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-[400px] bg-muted/20 animate-pulse rounded-xl"></div>
            <div className="col-span-3 h-[400px] bg-muted/20 animate-pulse rounded-xl"></div>
        </div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* User Growth Chart - Main Wide Chart */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New student registrations over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Course Popularity - Pie Chart */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Popular Courses</CardTitle>
                    <CardDescription>Top 5 courses by student enrollment</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.coursePopularity}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.coursePopularity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Revenue Trends - Bar Chart (Full Width) */}
            <Card className="col-span-7">
                <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Estimated revenue generation over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.revenueTrends}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Revenue']}
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="revenue" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
