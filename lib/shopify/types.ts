export interface ShopifyProduct {
    id?: number;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    status: 'active' | 'draft' | 'archived';
    variants: ShopifyVariant[];
    images: ShopifyImage[];
}

export interface ShopifyVariant {
    price: string;
    sku: string;
    inventory_quantity: number;
    option1?: string;
}

export interface ShopifyImage {
    src: string;
    position?: number;
}
