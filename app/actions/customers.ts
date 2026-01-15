"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TablesInsert } from "@/lib/database.types";

export async function searchCustomers(query: string) {
    const supabase = await createClient();

    let queryBuilder = supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    if (query) {
        queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error("Search error:", error);
        return [];
    }

    return data;
}

export async function createCustomer(formData: FormData) {
    const supabase = await createClient();

    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const idType = formData.get("id_type") as "driver_license" | "passport" | "state_id" | "matricula_consular" | "other";
    const idNumber = formData.get("id_number") as string;

    // Basic validation
    if (!firstName || !lastName || !idType || !idNumber) {
        return { error: "Missing required fields" };
    }

    // Get current user for created_by (though RLS might handle default or we set it explicitly)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const newCustomer: TablesInsert<"customers"> = {
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        id_type: idType,
        id_number: idNumber,
        created_by: user.id
    };

    const { data, error } = await supabase
        .from("customers")
        .insert(newCustomer)
        .select()
        .single();

    if (error) {
        console.error("Create customer error:", error);
        return { error: error.message };
    }

    return { success: true, customer: data };
}
