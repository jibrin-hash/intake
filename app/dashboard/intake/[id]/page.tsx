"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getIntake, completeIntake, deleteItem } from "@/app/actions/intake";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, CheckCircle, AlertTriangle, Trash2, Pencil, Camera } from "lucide-react";
import Link from "next/link";
import { Tables } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge"; // Ensure this exists or use plain div
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { Calendar } from "@/components/ui/calendar";

type IntakeWithDetails = Tables<"intakes"> & {
    customer: Tables<"customers">;
    items: (Tables<"items"> & {
        images: Tables<"item_images">[]
    })[];
};

export default function IntakeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [intake, setIntake] = useState<IntakeWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [holdDays, setHoldDays] = useState(14);
    const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
    const [reporting, setReporting] = useState(false);

    useEffect(() => {
        async function load() {
            if (!id) return;
            const data = await getIntake(id);
            console.log("INTAKE FETCHED:", data); // Debug
            setIntake(data as IntakeWithDetails);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Remove this item from the intake?")) return;
        setLoading(true); // briefly block interaction
        const res = await deleteItem(itemId);
        if (res.error) {
            alert(res.error);
            setLoading(false);
        } else {
            window.location.reload();
        }
    };

    const handleComplete = async () => {
        if (!id || !intake) return;
        // Native confirm removed in favor of AlertDialog

        // setCompleting is handled by Dialog open state now, but we use loading for the async op
        setLoading(true);

        let expiryDate: Date;
        if (holdDays === -1) {
            if (!customDate) {
                alert("Please select a date");
                setLoading(false);
                return;
            }
            expiryDate = customDate;
        } else {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + holdDays);
        }

        const res = await completeIntake(id, expiryDate.toISOString());
        if (res.error) {
            alert(res.error);
            setLoading(false);
            setCompleting(false);
        } else {
            // Reload to show "Report to LeadsOnline" button and updated status
            window.location.reload();
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (!intake) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Intake not found</div>;

    const isEditable = intake.status === "draft";

    const handleReportToLeadsOnline = async () => {
        if (!id) return;
        setReporting(true);
        const { submitToLeadsOnline } = await import("@/app/actions/intake");
        const res = await submitToLeadsOnline(id);

        if (res.error) {
            alert("LeadsOnline Error: " + res.error);
        } else {
            alert("Successfully reported to LeadsOnline!");
            window.location.reload();
        }
        setReporting(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">Intake #{intake.id.slice(0, 8)}</h1>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${intake.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {intake.status}
                        </span>
                    </div>
                    <div className="text-muted-foreground flex gap-4 items-center">
                        <div>Dictionary Customer: <Link href="#" className="underline">{intake.customer?.first_name} {intake.customer?.last_name}</Link></div>
                        {intake.status === "completed" && (
                            intake.leadsonline_ticket_id === "SENT" || intake.leadsonline_ticket_id ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 gap-1 pl-1.5 py-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Reported to LeadsOnline
                                </Badge>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handleReportToLeadsOnline} disabled={reporting}>
                                    {reporting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-2 h-3 w-3" />}
                                    Report to LeadsOnline
                                </Button>
                            )
                        )}
                    </div>
                </div>

                {isEditable && (
                    <Dialog open={completing} onOpenChange={setCompleting}>
                        <DialogTrigger asChild>
                            <Button disabled={completing || intake.items.length === 0} variant={intake.items.length > 0 ? "default" : "secondary"}>
                                {completing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Complete Intake
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Complete Intake</DialogTitle>
                                <DialogDescription>
                                    Review and confirm the hold period for these items.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Hold Duration</Label>
                                    <Select value={String(holdDays)} onValueChange={(v) => setHoldDays(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="14">Standard (14 Days)</SelectItem>
                                            <SelectItem value="30">Extended (30 Days)</SelectItem>
                                            <SelectItem value="0">Immediate Release (0 Days)</SelectItem>
                                            <SelectItem value="-1">Custom Date...</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {holdDays === -1 ? (
                                        <div className="border rounded-md p-2 flex justify-center">
                                            <Calendar
                                                mode="single"
                                                selected={customDate}
                                                onSelect={setCustomDate}
                                                initialFocus
                                                disabled={(date) => date < new Date()}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Items will be released on {new Date(Date.now() + holdDays * 86400000).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-md bg-muted p-3 text-sm flex gap-3 items-start">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <div className="text-muted-foreground">
                                        This will change status to <strong>On Hold</strong> and lock editing until {
                                            holdDays === -1
                                                ? (customDate ? customDate.toLocaleDateString() : "selected date")
                                                : new Date(Date.now() + holdDays * 86400000).toLocaleDateString()
                                        }. This cannot be undone.
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCompleting(false)}>Cancel</Button>
                                <Button onClick={handleComplete} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Complete"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Items List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Items ({intake.items.length})</h2>
                    {isEditable && (
                        <Button asChild size="sm">
                            <Link href={`/dashboard/intake/${id}/add-item`}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Link>
                        </Button>
                    )}
                </div>

                {intake.items.length === 0 ? (
                    <div className="p-12 border border-dashed rounded-lg text-center text-muted-foreground flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 mb-4 opacity-50" />
                        No items added yet. Click "Add Item" to start.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {intake.items.map(item => {
                            const releaseDate = item.hold_expires_at ? new Date(item.hold_expires_at) : null;
                            const isReleased = releaseDate && releaseDate < new Date();
                            const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];

                            return (
                                <div key={item.id} className="p-4 border rounded bg-card flex gap-4 items-start group">
                                    {/* Image Thumbnail */}
                                    <div className="h-20 w-20 bg-muted rounded overflow-hidden flex-shrink-0 border">
                                        {primaryImage ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/intake-photos/${primaryImage.storage_path}`}
                                                alt="Item"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                <Camera className="h-6 w-6 opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{item.brand} {item.model}</h3>
                                                <p className="text-sm text-muted-foreground font-mono">SN: {item.serial_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">${item.purchase_price}</div>
                                                <Badge
                                                    variant={item.status === 'published' ? 'default' : 'outline'}
                                                    className={`mt-1 capitalize whitespace-nowrap ${item.status === 'published' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200 shadow-none' :
                                                        item.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                            item.status === 'cleared_for_resale' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                                                        }`}
                                                >
                                                    {item.status.replace(/_/g, " ")}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-secondary px-2 py-0.5 rounded text-xs text-foreground">{item.category}</span>
                                                <span className="border px-2 py-0.5 rounded text-xs">{item.condition}</span>
                                            </div>

                                            {item.status === 'on_hold' && releaseDate && (
                                                <div className="flex items-center gap-1 text-orange-600">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Releases: {releaseDate.toLocaleDateString()}</span>
                                                </div>
                                            )}

                                            {item.status === 'published' && (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Live on Shopify</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isEditable && (
                                        <div className="flex flex-col gap-1 border-l pl-4 ml-2">
                                            <Button variant="ghost" size="icon" asChild title="Add Photos">
                                                <Link href={`/dashboard/intake/${id}/items/${item.id}/photos`}>
                                                    <Camera className="h-4 w-4 text-muted-foreground" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild title="Edit Item">
                                                <Link href={`/dashboard/intake/${id}/edit-item/${item.id}`}>
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item.id)} title="Delete">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
