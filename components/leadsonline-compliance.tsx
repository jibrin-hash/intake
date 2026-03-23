"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { syncLeadsOnlineReports, getLeadsOnlineComplianceStatus } from "@/app/actions/intake";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/lib/database.types";

export function LeadsOnlineCompliance() {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState<Tables<"leadsonline_no_transaction_reports">[]>([]);
    const [lastSync, setLastSync] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
        const data = await getLeadsOnlineComplianceStatus();
        setReports(data as Tables<"leadsonline_no_transaction_reports">[]);
    }, []);

    const handleSync = useCallback(async (isAuto = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await syncLeadsOnlineReports();
            if (res.error) {
                if (!isAuto) toast.error("Sync Error: " + res.error);
            } else {
                if (!isAuto && res.results && res.results.length > 0) {
                    toast.success(`Reported ${res.results.length} missing days to LeadsOnline!`);
                } else if (!isAuto) {
                    toast.success("Everything is up to date!");
                }
                await loadStatus();
                localStorage.setItem("last_leadsonline_sync", new Date().toISOString());
                setLastSync(new Date().toISOString());
            }
        } catch (err) {
            console.error("Sync failed:", err);
            if (!isAuto) toast.error("An unexpected error occurred during sync.");
        } finally {
            setLoading(false);
        }
    }, [loading, loadStatus]);

    useEffect(() => {
        loadStatus();
        
        // Auto-sync logic (once every 12 hours)
        const storedSync = localStorage.getItem("last_leadsonline_sync");
        setLastSync(storedSync);
        
        if (!storedSync || (new Date().getTime() - new Date(storedSync).getTime() > 12 * 60 * 60 * 1000)) {
            console.log("[LeadsOnline] Triggering automatic sync...");
            handleSync(true);
        }
    }, [loadStatus, handleSync]);

    return (
        <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    LeadsOnline Compliance
                </CardTitle>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleSync()} 
                    disabled={loading}
                    title="Force Sync"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Automatically reporting days with zero transactions to ensure your store remains compliant.
                    </p>
                    
                    <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            Recent Reports (Last 14 Days)
                        </div>
                        {reports.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 opacity-50" />
                                No &quot;No Transaction&quot; reports needed recently.
                            </div>
                        ) : (
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                {reports.map((report) => (
                                    <div key={report.id} className="flex justify-between items-center text-sm p-1.5 border rounded bg-muted/30">
                                        <span className="font-medium">{new Date(report.report_date).toLocaleDateString()}</span>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">
                                            REPORTED
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {lastSync && (
                        <div className="text-[10px] text-muted-foreground italic">
                            Last checked: {new Date(lastSync).toLocaleString()}
                        </div>
                    )}
                    
                    {!loading && reports.length === 14 && (
                        <p className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                            Full compliance coverage detected for the last 14 days.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
