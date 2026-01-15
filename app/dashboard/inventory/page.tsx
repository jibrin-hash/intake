"use server";

import { getInventory } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InventorySearch } from "@/components/inventory/inventory-search";
import { InventoryFilter } from "@/components/inventory/inventory-filter";
import { ImageIcon } from "lucide-react";
import { PublishButton } from "@/components/inventory/publish-button";

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string;
        status?: string;
        page?: string;
    }>;
}) {
    const params = await searchParams;
    const query = params.q || "";
    const status = params.status || "all";
    const currentPage = Number(params.page) || 1;

    const { data: items, count } = await getInventory({
        search: query,
        status,
        page: currentPage,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your items ({count || 0} total)
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <InventorySearch />
                    <InventoryFilter />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead>
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">Img</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Item</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Serial</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Intake Date</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items && items.length > 0 ? (
                                items.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            {item.images && item.images.length > 0 ? (
                                                <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/intake-photos/${item.images[0].storage_path}`}
                                                        alt="Item"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle font-medium">
                                            {item.brand} {item.model}
                                        </td>
                                        <td className="p-4 align-middle font-mono text-xs">{item.serial_number}</td>
                                        <td className="p-4 align-middle">
                                            <Badge
                                                variant={item.status === 'published' ? 'default' : 'outline'}
                                                className={`capitalize whitespace-nowrap ${item.status === 'published' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200 shadow-none' :
                                                    item.status === 'sold' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                        item.status === 'flagged' ? 'bg-red-100 text-red-800 border-red-200' : ''
                                                    }`}
                                            >
                                                {item.status.replace(/_/g, " ")}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">${item.purchase_price}</td>
                                        <td className="p-4 align-middle">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                {item.status === 'cleared_for_resale' && (
                                                    <PublishButton itemId={item.id} />
                                                )}
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/intake/${item.intake_id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No items found matching your filters.
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
