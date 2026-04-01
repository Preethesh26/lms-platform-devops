import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

type AnalyticsChartsProps = {
    data: {
        userGrowth: Array<{ name: string; users: number }>;
        revenueTrends: Array<{ name: string; revenue: number }>;
        coursePopularity: Array<{ name: string; value: number }>;
    } | null;
    loading: boolean;
};

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const DARK_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#f87171'];

export function AnalyticsCharts({ data, loading }: AnalyticsChartsProps) {
    if (loading || !data) {
        return <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-[440px] bg-muted/20 dark:bg-slate-900/50 animate-pulse rounded-[2.5rem] border-2 border-dashed border-muted"></div>
            <div className="col-span-3 h-[440px] bg-muted/20 dark:bg-slate-900/50 animate-pulse rounded-[2.5rem] border-2 border-dashed border-muted"></div>
        </div>;
    }

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            {/* User Growth Chart - Main Wide Chart */}
            <Card className="col-span-4 rounded-[2.5rem] border-2 shadow-sm dark:bg-slate-900/50 transition-all border-slate-100 dark:border-slate-800">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-xl font-black tracking-tight">User Acquisition</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">New student registrations (6-month trend)</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-8 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.userGrowth}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                stroke="#94A3B8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                fontVariant="bold"
                            />
                            <YAxis
                                stroke="#94A3B8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94A3B8', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="users"
                                stroke="#0ea5e9"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Course Popularity - Pie Chart */}
            <Card className="col-span-3 rounded-[2.5rem] border-2 shadow-sm dark:bg-slate-900/50 transition-all border-slate-100 dark:border-slate-800">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-xl font-black tracking-tight">Market Share</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Distribution of enrolled students</CardDescription>
                </CardHeader>
                <CardContent className="pb-8 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.coursePopularity}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={5}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.coursePopularity.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Legend
                                iconType="circle"
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Revenue Trends - Bar Chart (Full Width) */}
            <Card className="col-span-7 rounded-[2.5rem] border-2 shadow-sm dark:bg-slate-900/50 transition-all border-slate-100 dark:border-slate-800">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-xl font-black tracking-tight">Revenue Stream</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Projected income and growth trajectory</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-8 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.revenueTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                stroke="#94A3B8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#94A3B8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
