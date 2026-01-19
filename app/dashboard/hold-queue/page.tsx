"use server";

import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge"; // Ensure we have badge
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { ReleaseButton } from "@/components/hold-queue/release-button";
import Link from "next/link";

export default async function HoldQueuePage() {
    const supabase = await createClient();

    // Fetch items on hold, ordered by expiration (soonest first)
    const { data: items, error } = await supabase
        .from("items")
        .select(`
      *,
      intake:intakes(
        customer:customers(*)
      )
    `)
        .eq("status", "on_hold")
        .order("hold_expires_at", { ascending: true });

    if (error) {
        return <div className="p-12 text-destructive">Error loading hold queue: {error.message}</div>;
    }

    const now = new Date();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Hold Queue</h1>
                <div className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Calculating compliance timelines</span>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead>
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Item</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Serial</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hold Expires</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items && items.length > 0 ? (
                                items.map((item) => {
                                    const expiresAt = item.hold_expires_at ? new Date(item.hold_expires_at) : null;
                                    const isExpired = expiresAt && expiresAt < now;
                                    const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                                    return (
                                        <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">
                                                <Link href={`/dashboard/intake/${item.intake_id}`} className="hover:underline font-semibold text-primary">
                                                    {item.brand} {item.model}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">{item.category}</div>
                                            </td>
                                            <td className="p-4 align-middle">{item.serial_number}</td>
                                            <td className="p-4 align-middle">
                                                {/* @ts-ignore join */}
                                                {item.intake?.customer?.first_name} {item.intake?.customer?.last_name}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {expiresAt ? expiresAt.toLocaleDateString() : "N/A"}
                                                <div className="text-xs text-muted-foreground">
                                                    {isExpired ? "Cleared" : `${daysLeft} days left`}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isExpired ? 'border-transparent bg-green-100 text-green-800' : 'border-transparent bg-yellow-100 text-yellow-800'}`}>
                                                    {isExpired ? "Ready for Release" : "On Hold"}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/dashboard/intake/${item.intake_id}`}>
                                                            View Intake
                                                        </Link>
                                                    </Button>
                                                    {isExpired ? (
                                                        <ReleaseButton itemId={item.id} />
                                                    ) : (
                                                        <Button size="sm" variant="ghost" disabled className="h-8 gap-1 opacity-50">
                                                            <Clock className="w-3 h-3" />
                                                            Wait
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground h-24 align-middle">
                                        No items currently on hold.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
