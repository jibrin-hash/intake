"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function InventorySearch() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        params.set("page", "1");
        replace(`/dashboard/inventory?${params.toString()}`);
    }, 300);

    return (
        <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search inventory..."
                className="w-full rounded-lg bg-background pl-8 md:w-[336px]"
                defaultValue={searchParams.get("q")?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </div>
    );
}
