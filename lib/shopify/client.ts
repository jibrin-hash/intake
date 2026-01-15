import { ShopifyProduct } from "./types";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

export async function createShopifyProduct(product: ShopifyProduct): Promise<{ id: number; handle: string }> {
    if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
        throw new Error("Missing Shopify Configuration (SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN)");
    }

    console.log(`Syncing to Shopify Store: ${SHOPIFY_DOMAIN}...`);

    const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-01/products.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_TOKEN
        },
        body: JSON.stringify({ product })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Shopify API Error:", JSON.stringify(errorData, null, 2));
        throw new Error(`Shopify API Failed: ${response.statusText} - ${JSON.stringify(errorData.errors)}`);
    }

    const data = await response.json();
    return {
        id: data.product.id,
        handle: data.product.handle
    };
}
