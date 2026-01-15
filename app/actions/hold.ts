"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function releaseItem(itemId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Verify it is actually expired
    const { data: item } = await supabase
        .from("items")
        .select("hold_expires_at, status")
        .eq("id", itemId)
        .single();

    if (!item) return { error: "Item not found" };
    if (item.status !== "on_hold") return { error: `Item is not on hold (Status: ${item.status})` };

    const now = new Date();
    const expiresAt = new Date(item.hold_expires_at);

    if (expiresAt > now) {
        console.log(`[releaseItem] FAILED: Hold period not expired. Expires: ${expiresAt}, Now: ${now}`);
        return { error: "Hold period has not expired yet." };
    }

    // Update status
    console.log(`[releaseItem] Updating item ${itemId} status to cleared_for_resale`);
    const { error, data: updatedData } = await adminClient
        .from("items")
        .update({ status: "cleared_for_resale" })
        .eq("id", itemId)
        .select() // Return the updated row to verify
        .single();

    if (error) {
        console.error("[releaseItem] Update Error:", error);
        return { error: error.message };
    }

    console.log(`[releaseItem] Update Success. New Status: ${updatedData?.status}`);

    revalidatePath("/dashboard/hold-queue");
    revalidatePath("/dashboard/inventory");
    console.log(`[releaseItem] Revalidated paths`);
    return { success: true };
}
