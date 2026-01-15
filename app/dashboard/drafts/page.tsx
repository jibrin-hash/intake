import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DraftsPage() {
    const supabase = await createClient();

    const { data: rawDrafts, error } = await supabase
        .from("intakes")
        .select(`
            *,
            customer:customers(*),
            items(count)
        `)
        .eq("status", "draft")
        .order("updated_at", { ascending: false });

    // Filter out empty drafts (where items count is 0)
    const drafts = rawDrafts?.filter(d => d.items[0]?.count > 0) || [];

    if (error) {
        return <div className="p-8 text-destructive">Error loading drafts: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
                    <p className="text-muted-foreground">Resume pending intakes.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/intake/new">New Intake</Link>
                </Button>
            </div>

            {drafts?.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/10">
                    <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Open Drafts</h3>
                    <p className="text-muted-foreground mb-4">All intakes are completed or cleared.</p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/intake/new">Start New Intake</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {drafts?.map((draft) => (
                        <Link key={draft.id} href={`/dashboard/intake/${draft.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <span className="font-mono text-sm font-medium">#{draft.id.slice(0, 8)}</span>
                                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                        Draft
                                    </span>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-foreground font-medium">
                                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {draft.customer?.first_name} {draft.customer?.last_name}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {new Date(draft.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t mt-auto">
                                        <div className="text-sm text-muted-foreground">
                                            {draft.items[0]?.count || 0} items
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 p-0 hover:bg-transparent">
                                            Resume <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
