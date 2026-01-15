import { getDashboardStats, getRecentActivity } from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, Package, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const activity = await getRecentActivity();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your intake performance.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/intake/new">New Intake</Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spend (Month)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats.monthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            For current month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Intakes (Month)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.intakesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            processed this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hold Queue</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.holdCount}</div>
                        <p className="text-xs text-muted-foreground">
                            items waiting for release
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            registered sellers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {activity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity found.</p>
                            ) : activity.map((intake) => (
                                <div key={intake.id} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Intake #{intake.id.slice(0, 8)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {intake.customer?.first_name} {intake.customer?.last_name}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm">
                                        {intake.status === 'completed' ? (
                                            <span className="text-green-600">Completed</span>
                                        ) : (
                                            <span className="text-yellow-600">Draft</span>
                                        )}
                                    </div>
                                    <div className="ml-4 text-sm text-muted-foreground">
                                        {new Date(intake.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Column / Quick Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/dashboard/intake/new">
                                <Users className="mr-2 h-4 w-4" />
                                Start New Intake
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/dashboard/hold-queue">
                                <Package className="mr-2 h-4 w-4" />
                                Check Hold Queue
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
