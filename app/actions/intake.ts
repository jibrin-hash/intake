"use server";

import { createClient } from "@/lib/supabase/server";
import { TablesInsert } from "@/lib/database.types";
import { redirect } from "next/navigation";
import { LeadsOnlineClient } from "@/lib/leadsonline/client";

export async function createIntake(customerId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }


    // Debug: Check if profile exists
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    if (!profile) {
        // Auto-fix: Create profile if missing (e.g. legacy user)
        const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata.full_name || "Staff Member",
            role: "clerk"
        });
        if (profileError) {
            console.error("Failed to create missing profile:", profileError);
            return { error: "User profile missing and could not be created." };
        }
    }

    // Insert first (without select) to isolate RLS on insert vs select
    const { error: insertError } = await supabase
        .from("intakes")
        .insert({
            customer_id: customerId,
            processor_id: user.id,
            status: "draft"
        });

    if (insertError) {
        console.error("Create intake INSERT error:", insertError);
        throw new Error(insertError.message);
    }

    // Then select identifying the latest draft for this user/customer
    const { data, error: selectError } = await supabase
        .from("intakes")
        .select()
        .eq("customer_id", customerId)
        .eq("processor_id", user.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (selectError) {
        console.error("Create intake SELECT error:", selectError);
        throw new Error("Intake created but failed to retrieve. Check RLS.");
    }



    return data;
}

export async function getIntake(intakeId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("intakes")
        .select(`
      *,
      customer:customers(*),
      items:items(
          *,
          images:item_images(*)
      )
    `)
        .eq("id", intakeId)
        .single();

    if (error) return null;
    return data;
}

export async function addItem(intakeId: string, formData: FormData) {
    const supabase = await createClient();

    const category = formData.get("category") as string;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const serial = formData.get("serial_number") as string;
    const condition = formData.get("condition") as string;
    const price = parseFloat(formData.get("purchase_price") as string);
    const description = formData.get("description") as string;

    if (!category || !brand || !model || !price) {
        return { error: "Missing required fields" };
    }

    const { data, error } = await supabase
        .from("items")
        .insert({
            intake_id: intakeId,
            category,
            brand,
            model,
            serial_number: serial,
            condition,
            description,
            purchase_price: price,
            status: "intake_started" // Default
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, item: data };
}

export async function getItem(itemId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", itemId)
        .single();

    if (error) return null;
    return data;
}

export async function updateItem(itemId: string, formData: FormData) {
    const supabase = await createClient();

    const category = formData.get("category") as string;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const serial = formData.get("serial_number") as string;
    const condition = formData.get("condition") as string;
    const price = parseFloat(formData.get("purchase_price") as string);
    const description = formData.get("description") as string;

    if (!category || !brand || !model || !price) {
        return { error: "Missing required fields" };
    }

    const { data, error } = await supabase
        .from("items")
        .update({
            category,
            brand,
            model,
            serial_number: serial,
            condition,
            description,
            purchase_price: price
        })
        .eq("id", itemId)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, item: data };
}

export async function deleteItem(itemId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

// --- Image Actions ---

export async function getItemImages(itemId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("item_images")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function saveItemImage(itemId: string, path: string) {
    const supabase = await createClient(); // Use service role if needed, but RLS allows staff INSERT
    const { error } = await supabase
        .from("item_images")
        .insert({
            item_id: itemId,
            storage_path: path,
            is_primary: false // Default
        });

    if (error) return { error: error.message };
    return { success: true };
}

export async function deleteItemImage(imageId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("item_images")
        .delete()
        .eq("id", imageId);

    if (error) return { error: error.message };
    return { success: true };
}

export async function completeIntake(intakeId: string, holdExpiresAt: string) {
    const supabase = await createClient();

    // 1. Move items to 'on_hold' and set expiration
    // We update items FIRST because RLS requires the parent Intake to be 'draft' 
    // to allow item updates. If we complete the intake first, item updates will fail.

    const { error: itemError } = await supabase
        .from("items")
        .update({
            status: "on_hold",
            hold_expires_at: holdExpiresAt
        })
        .eq("intake_id", intakeId)
        .eq("status", "intake_started");

    if (itemError) {
        console.error("Complete intake ITEM error:", itemError);
        return { error: itemError.message };
    }

    // 2. Mark intake as completed
    const { error: intakeError } = await supabase
        .from("intakes")
        .update({ status: "completed" })
        .eq("id", intakeId);

    if (intakeError) {
        console.error("Complete intake STATUS error:", intakeError);
        return { error: intakeError.message };
    }

    return { success: true };
}

export async function submitToLeadsOnline(intakeId: string) {
    const supabase = await createClient();

    // 1. Fetch full intake data
    const { data: intake, error: intakeError } = await supabase
        .from("intakes")
        .select(`
            *,
            customer:customers(*),
            items:items(
                *,
                images:item_images(*)
            )
        `)
        .eq("id", intakeId)
        .single();

    if (intakeError || !intake) {
        console.error("LeadsOnline Fetch Error:", intakeError);
        return { error: "Failed to fetch intake data" };
    }

    // 2. Initial validation
    if (intake.status !== "completed") {
        return { error: "Intake must be completed before reporting." };
    }

    // 3. Configure Client
    const storeId = process.env.LEADSONLINE_STORE_ID;
    const username = process.env.LEADSONLINE_USERNAME;
    const password = process.env.LEADSONLINE_PASSWORD;
    const url = process.env.LEADSONLINE_URL;

    if (!storeId || !username || !password || !url) {
        console.error("LeadsOnline Config Missing");
        return { error: "LeadsOnline configuration missing on server." };
    }

    const client = new LeadsOnlineClient({ storeId, username, password, url });

    // 4. Submit
    try {
        const result = await client.submitTransaction(intake, intake.items, intake.customer);

        // 5. Save ticket ID
        // The ticket number logic is currently client-side random or from DB ID.
        // We should extract what we *actually* sent or generate it deterministically.
        // For now, let's assume valid submission means we can mark it.
        // Ideally we'd parse `result.raw` to get confirmation, but for now we'll update the row.

        const { error: updateError } = await supabase
            .from("intakes")
            .update({ leadsonline_ticket_id: "SENT" })
            .eq("id", intakeId);

        if (updateError) {
            console.error("Failed to update ticket ID in DB:", updateError);
        }

        return { success: true, response: result.raw };
    } catch (e: any) {
        console.error("LeadsOnline Submission Failed:", e);
        return { error: e.message || "Submission failed" };
    }
}
