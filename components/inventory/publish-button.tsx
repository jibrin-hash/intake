"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";
import { publishItemToShopify } from "@/app/actions/shopify";
import { toast } from "sonner";

export function PublishButton({ itemId }: { itemId: string }) {
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        setLoading(true);
        try {
            const result = await publishItemToShopify(itemId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Successfully published to Shopify!");
            }
        } catch (error) {
            toast.error("Failed to publish item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="default" // Primary action
            className="h-8 gap-1 bg-blue-600 hover:bg-blue-700"
            onClick={handlePublish}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingBag className="w-3 h-3" />}
            Publish
        </Button>
    );
}
