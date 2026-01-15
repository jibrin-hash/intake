"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { releaseItem } from "@/app/actions/hold";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ReleaseButton({ itemId }: { itemId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRelease = async () => {
        setLoading(true);
        try {
            const result = await releaseItem(itemId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Item released for resale!");
                router.refresh(); // Force server component refresh
            }
        } catch (error) {
            toast.error("Failed to release item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200"
            onClick={handleRelease}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
            Release
        </Button>
    );
}
