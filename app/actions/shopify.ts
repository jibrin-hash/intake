"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createShopifyProduct } from "@/lib/shopify/client";
import { revalidatePath } from "next/cache";

export async function publishItemToShopify(itemId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // 1. Fetch full item details including images
    const { data: item, error } = await supabase
        .from("items")
        .select(`
            *,
            images:item_images(*)
        `)
        .eq("id", itemId)
        .single();

    if (error || !item) {
        return { error: "Item not found" };
    }

    if (item.status !== "cleared_for_resale") {
        return { error: `Item is not ready for resale (Status: ${item.status})` };
    }

    // 2. Format for shopify
    const shopifyPayload = {
        title: `${item.brand} ${item.model} (${item.condition})`,
        body_html: `<p>${item.description}</p><p><strong>Serial:</strong> ${item.serial_number}</p>`,
        vendor: item.brand,
        product_type: item.category,
        status: 'active' as const,
        variants: [
            {
                price: item.purchase_price.toString(), // In real app, applying a markup formula here
                sku: item.id.slice(0, 8).toUpperCase(),
                inventory_quantity: 1
            }
        ],
        images: item.images.map((img: any) => ({
            src: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/intake-photos/${img.storage_path}`
        }))
    };

    try {
        // 3. Call (Mock) API
        const response = await createShopifyProduct(shopifyPayload);

        // 4. Update local status
        const { error: updateError } = await adminClient
            .from("items")
            .update({
                status: "published",
                // In a real schema we would save the shopify_product_id here
            })
            .eq("id", itemId);

        if (updateError) throw new Error(updateError.message);

        revalidatePath("/dashboard/inventory");
        return { success: true, shopifyId: response.id };

    } catch (e: any) {
        console.error("Shopify Sync Error:", e);
        return { error: e.message || "Failed to sync to Shopify" };
    }
}
