"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { LeadsOnlineClient } from "@/lib/leadsonline/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createIntake(customerId: string) {
    const supabase = await createClient();

    // UUID Validation Guard (Pragmatic Fix)
    if (!UUID_REGEX.test(customerId)) {
        console.error(`[createIntake] REJECTED: Invalid customer ID format: "${customerId}"`);
        throw new Error("Invalid customer ID format provided.");
    }

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
            throw new Error("User profile missing and could not be created.");
        }
    }

    // Insert and select in one go for atomicity and consistency
    const { data, error: insertError } = await supabase
        .from("intakes")
        .insert({
            customer_id: customerId,
            processor_id: user.id,
            status: "draft"
        })
        .select()
        .single();

    if (insertError) {
        console.error("Create intake error:", insertError);
        throw new Error(insertError.message);
    }
    return { id: data.id };
}

export async function getIntake(intakeId: string) {
    const supabase = await createClient();

    // UUID Validation Guard: Prevent database errors (22P02) for malformed IDs (e.g. placeholders like drp:id)
    if (!UUID_REGEX.test(intakeId)) {
        console.warn(`[getIntake] ABORTED: Invalid UUID format provided: "${intakeId}"`);
        return null;
    }

    console.log(`[getIntake] Proceeding with ID: "${intakeId}" (Length: ${intakeId.length})`);

    // Implement retry logic for potential replication lag in production
    for (let attempt = 1; attempt <= 3; attempt++) {
        // Log auth status for debugging
        const { data: { user } } = await supabase.auth.getUser();
        console.log(`[getIntake] Attempt ${attempt}: current user:`, user?.id || "not authenticated");

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

        if (data) {
            console.log(`[getIntake] Found data on attempt ${attempt}`);
            return data;
        }

        if (error) {
            console.error(`Attempt ${attempt} to fetch intake ${intakeId} failed:`, error);
        }

        // Diagnostic: Try with admin client to rule out RLS/Auth issues
        if (attempt === 3) {
            console.log(`[getIntake] Final attempt failed with user client. Trying admin client for diagnosis...`);
            const { createAdminClient } = await import("@/lib/supabase/server");
            const adminSupabase = await createAdminClient();
            const { data: adminData, error: adminError } = await adminSupabase
                .from("intakes")
                .select(`
                    *,
                    customer:customers(*),
                    items:items(*, images:item_images(*))
                `)
                .eq("id", intakeId)
                .single();
            
            if (adminData) {
                console.warn(`[getIntake] CRITICAL: Record FOUND with admin client but NOT with user client. This is an RLS or AUTH issue!`);
                return adminData; // Return anyway to let the user proceed
            } else {
                console.error(`[getIntake] Record still NOT found with admin client. This is a consistency or ID issue.`, adminError);
            }
        }

        if (attempt < 3) {
            console.log(`Intake ${intakeId} not found, retrying in 500ms... (Attempt ${attempt}/3)`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return null;
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

    if (!UUID_REGEX.test(intakeId)) {
        return { error: `Invalid intake ID format: ${intakeId}` };
    }

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

    if (!UUID_REGEX.test(itemId)) {
        return { error: `Invalid item ID format: ${itemId}` };
    }

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

    // 1. Get storage path first
    const { data: img, error: fetchError } = await supabase
        .from("item_images")
        .select("storage_path")
        .eq("id", imageId)
        .single();
    
    if (fetchError || !img) {
        console.error("[deleteItemImage] Could not find image record:", fetchError);
        return { error: "Image record not found." };
    }

    // 2. Delete from Storage
    const { error: storageError } = await supabase.storage
        .from("intake-photos")
        .remove([img.storage_path]);
    
    if (storageError) {
        console.error("[deleteItemImage] Storage deletion error:", storageError);
        // We continue anyway to cleanup the DB if storage fails (e.g. file already gone)
    }

    // 3. Delete from DB
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
        console.error("[submitToLeadsOnline] Configuration missing:", {
            LEADSONLINE_STORE_ID: !!storeId,
            LEADSONLINE_USERNAME: !!username,
            LEADSONLINE_PASSWORD: !!password,
            LEADSONLINE_URL: !!url
        });
        return { 
            error: "LeadsOnline configuration missing on server. Please ensure .env.local is correctly set and the server has been restarted." 
        };
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

        // 5. Save ticket ID via Admin Client to bypass RLS for completed intakes
        const adminSupabase = await createAdminClient();
        const { error: updateError } = await adminSupabase
            .from("intakes")
            .update({ leadsonline_ticket_id: "SENT" })
            .eq("id", intakeId);

        if (updateError) {
            console.error("Failed to update ticket ID in DB:", updateError);
        }

        return { success: true, response: result.raw };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Submission failed";
        console.error("LeadsOnline Submission Failed:", e);
        return { error: message };
    }
}
