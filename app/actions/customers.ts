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

    // Compliance Fields
    const address1 = formData.get("address_line_1") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const postalCode = formData.get("postal_code") as string;
    const dob = formData.get("dob") as string;
    const gender = formData.get("gender") as string;
    const race = formData.get("race") as string;
    const height = formData.get("height") ? parseInt(formData.get("height") as string) : null;
    const weight = formData.get("weight") ? parseInt(formData.get("weight") as string) : null;
    const eyeColor = formData.get("eye_color") as string;
    const hairColor = formData.get("hair_color") as string;


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
        created_by: user.id,
        // Compliance
        address_line_1: address1 || null,
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        dob: dob || null,
        gender: gender || null,
        race: race || null,
        height: height,
        weight: weight,
        eye_color: eyeColor || null,
        hair_color: hairColor || null
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

export async function getCustomer(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}

export async function updateCustomer(id: string, formData: FormData) {
    const supabase = await createClient();

    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const idType = formData.get("id_type") as "driver_license" | "passport" | "state_id" | "matricula_consular" | "other";
    const idNumber = formData.get("id_number") as string;

    // Compliance Fields
    const address1 = formData.get("address_line_1") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const postalCode = formData.get("postal_code") as string;
    const dob = formData.get("dob") as string;
    const gender = formData.get("gender") as string;
    const race = formData.get("race") as string;
    const height = formData.get("height") ? parseInt(formData.get("height") as string) : null;
    const weight = formData.get("weight") ? parseInt(formData.get("weight") as string) : null;
    const eyeColor = formData.get("eye_color") as string;
    const hairColor = formData.get("hair_color") as string;

    const updates: any = {
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        id_type: idType,
        id_number: idNumber,
        address_line_1: address1 || null,
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        dob: dob || null,
        gender: gender || null,
        race: race || null,
        height: height,
        weight: weight,
        eye_color: eyeColor || null,
        hair_color: hairColor || null,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select();

    if (error) {
        return { error: error.message };
    }

    if (!data || data.length === 0) {
        return { error: "Customer not found or access denied" };
    }

    return { success: true, customer: data[0] };
}
