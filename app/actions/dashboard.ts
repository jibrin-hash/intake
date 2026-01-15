"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
    const supabase = await createClient();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 1. Monthly Spend: Sum of purchase_price for items created this month
    const { data: spendData, error: spendError } = await supabase
        .from("items")
        .select("purchase_price")
        .gte("created_at", firstDayOfMonth);

    if (spendError) console.error("Error fetching spend:", spendError);

    const monthlySpend = spendData?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0;

    // 2. Intakes Count: Count of intakes created this month


    // 3. Hold Queue: Count of items currently 'on_hold'
    const { count: holdCount, error: holdError } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("status", "on_hold");

    if (holdError) console.error("Error fetching hold count:", holdError);

    // 4. Open Drafts: Count of intakes with status 'draft' that have items
    const { data: draftData, error: draftError } = await supabase
        .from("intakes")
        .select("items(count)")
        .eq("status", "draft");

    // Filter in JS because Supabase doesn't easily support filtering on related count
    const draftCount = draftData?.filter((d: any) => d.items[0]?.count > 0).length || 0;

    // 5. Total Customers: Count all customers
    const { count: customersCount, error: appsError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

    if (appsError) console.error("Error fetching customers:", appsError);

    // 2. Intakes Count: Count of intakes created this month (excluding empty drafts)
    // We need to fetch data to filter by item count
    const { data: intakesData, error: intakesError } = await supabase
        .from("intakes")
        .select("items(count)")
        .gte("created_at", firstDayOfMonth);

    const intakesCount = intakesData?.filter((d: any) => d.items[0]?.count > 0).length || 0;

    if (intakesError) console.error("Error fetching intakes count:", intakesError);

    return {
        monthlySpend,
        intakesCount,
        holdCount: holdCount || 0,
        draftCount,
        totalCustomers: customersCount || 0
    };
}

export async function getRecentActivity() {
    const supabase = await createClient();

    // Fetch latest 20 intakes (to allow for filtering empty ones) and return top 5 valid ones
    const { data: rawActivity, error } = await supabase
        .from("intakes")
        .select(`
            *,
            customer:customers(first_name, last_name),
            items(count)
        `)
        .order("updated_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching activity:", error);
        return [];
    }

    // Filter out intakes with 0 items and take top 5
    return rawActivity
        .filter((intake: any) => intake.items[0]?.count > 0)
        .slice(0, 5);
}
