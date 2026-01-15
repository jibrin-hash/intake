"use server";

import { createClient } from "@/lib/supabase/server";

export async function getExistingCategories() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("items")
        .select("category")
        .not("category", "is", null);

    // Distinct manually as .distinct() might not be available on all clients or easy to type
    const categories = Array.from(new Set(data?.map(item => item.category) || [])).sort();

    return categories.map(c => ({ value: c, label: c }));
}

export async function getExistingBrands(category: string) {
    const supabase = await createClient();
    let query = supabase
        .from("items")
        .select("brand")
        .not("brand", "is", null);

    if (category) {
        query = query.eq("category", category);
    }

    const { data } = await query;
    const brands = Array.from(new Set(data?.map(item => item.brand) || [])).sort();

    return brands.map(b => ({ value: b, label: b }));
}

export async function getExistingModels(brand: string, category: string) {
    const supabase = await createClient();
    let query = supabase
        .from("items")
        .select("model")
        .not("model", "is", null);

    if (brand) {
        query = query.eq("brand", brand);
    }
    if (category) {
        query = query.eq("category", category);
    }

    const { data } = await query;
    const models = Array.from(new Set(data?.map(item => item.model) || [])).sort();

    return models.map(m => ({ value: m, label: m }));
}

export async function getInventory({
    search,
    status,
    page = 1,
    limit = 50
}: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    const supabase = await createClient();

    let query = supabase
        .from("items")
        .select(`
            *,
            intake:intakes(
                customer:customers(first_name, last_name)
            ),
            images:item_images(*)
        `, { count: "exact" });

    if (status && status !== "all") {
        query = query.eq("status", status);
    } else {
        // Default behavior: Don't show "on_hold" items in the general inventory
        // They live in the Hold Queue
        query = query.neq("status", "on_hold");
    }

    if (search) {
        // Search across brand, model, serial_number
        query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,serial_number.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching inventory:", error);
        throw new Error(error.message);
    }

    return { data, count };
}
