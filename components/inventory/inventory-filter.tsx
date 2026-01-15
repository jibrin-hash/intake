"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export function InventoryFilter() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleFilter = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status && status !== "all") {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        replace(`/dashboard/inventory?${params.toString()}`);
    };

    return (
        <Select
            defaultValue={searchParams.get("status") || "all"}
            onValueChange={handleFilter}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="intake_started">Intake Started</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cleared_for_resale">Cleared for Resale</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
        </Select>
    );
}
