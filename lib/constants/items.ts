export const ITEM_CATEGORIES = [
    { value: "Phones", label: "Phones" },
    { value: "Tablets", label: "Tablets" },
    { value: "Laptops", label: "Laptops" },
    { value: "Desktops", label: "Desktops" },
    { value: "Smartwatches", label: "Smartwatches" },
    { value: "Cameras", label: "Cameras" },
    { value: "Lenses", label: "Lenses" },
    { value: "Audio", label: "Audio / Headphones" },
    { value: "Consoles", label: "Gaming Consoles" },
    { value: "Drones", label: "Drones" },
    { value: "Other", label: "Other" },
];

export const CATEGORY_BRANDS: Record<string, { value: string; label: string }[]> = {
    Phones: [
        { value: "Apple", label: "Apple" },
        { value: "Samsung", label: "Samsung" },
        { value: "Google", label: "Google" },
        { value: "Motorola", label: "Motorola" },
        { value: "OnePlus", label: "OnePlus" },
    ],
    Tablets: [
        { value: "Apple", label: "Apple" },
        { value: "Samsung", label: "Samsung" },
        { value: "Microsoft", label: "Microsoft" },
        { value: "Lenovo", label: "Lenovo" },
        { value: "Amazon", label: "Amazon" },
    ],
    Laptops: [
        { value: "Apple", label: "Apple" },
        { value: "Dell", label: "Dell" },
        { value: "HP", label: "HP" },
        { value: "Lenovo", label: "Lenovo" },
        { value: "Asus", label: "Asus" },
        { value: "Acer", label: "Acer" },
        { value: "Microsoft", label: "Microsoft" },
        { value: "Razer", label: "Razer" },
        { value: "MSI", label: "MSI" },
    ],
    Smartwatches: [
        { value: "Apple", label: "Apple" },
        { value: "Samsung", label: "Samsung" },
        { value: "Garmin", label: "Garmin" },
        { value: "Fitbit", label: "Fitbit" },
        { value: "Google", label: "Google" },
    ],
    Consoles: [
        { value: "Sony", label: "Sony" },
        { value: "Microsoft", label: "Microsoft" },
        { value: "Nintendo", label: "Nintendo" },
        { value: "Valve", label: "Valve" },
        { value: "Asus", label: "Asus" },
    ],
    Cameras: [
        { value: "Canon", label: "Canon" },
        { value: "Sony", label: "Sony" },
        { value: "Nikon", label: "Nikon" },
        { value: "Fujifilm", label: "Fujifilm" },
        { value: "Panasonic", label: "Panasonic" },
        { value: "Leica", label: "Leica" },
    ],
    Drones: [
        { value: "DJI", label: "DJI" },
    ]
};

export const BRAND_MODELS: Record<string, { value: string; label: string }[]> = {
    // Apple Phones
    "Apple-Phones": [
        { value: "iPhone 15 Pro Max", label: "iPhone 15 Pro Max" },
        { value: "iPhone 15 Pro", label: "iPhone 15 Pro" },
        { value: "iPhone 15 Plus", label: "iPhone 15 Plus" },
        { value: "iPhone 15", label: "iPhone 15" },
        { value: "iPhone 14 Pro Max", label: "iPhone 14 Pro Max" },
        { value: "iPhone 14 Pro", label: "iPhone 14 Pro" },
        { value: "iPhone 14 Plus", label: "iPhone 14 Plus" },
        { value: "iPhone 14", label: "iPhone 14" },
        { value: "iPhone 13 Pro Max", label: "iPhone 13 Pro Max" },
        { value: "iPhone 13 Pro", label: "iPhone 13 Pro" },
        { value: "iPhone 13", label: "iPhone 13" },
        { value: "iPhone 12 Pro Max", label: "iPhone 12 Pro Max" },
        { value: "iPhone 12", label: "iPhone 12" },
        { value: "iPhone 11", label: "iPhone 11" },
        { value: "iPhone SE (3rd Gen)", label: "iPhone SE (3rd Gen)" },
    ],
    // Samsung Phones
    "Samsung-Phones": [
        { value: "Galaxy S24 Ultra", label: "Galaxy S24 Ultra" },
        { value: "Galaxy S24+", label: "Galaxy S24+" },
        { value: "Galaxy S24", label: "Galaxy S24" },
        { value: "Galaxy S23 Ultra", label: "Galaxy S23 Ultra" },
        { value: "Galaxy S23", label: "Galaxy S23" },
        { value: "Galaxy Z Fold 5", label: "Galaxy Z Fold 5" },
        { value: "Galaxy Z Flip 5", label: "Galaxy Z Flip 5" },
        { value: "Galaxy A54", label: "Galaxy A54" },
    ],
    // Google Phones
    "Google-Phones": [
        { value: "Pixel 8 Pro", label: "Pixel 8 Pro" },
        { value: "Pixel 8", label: "Pixel 8" },
        { value: "Pixel 7 Pro", label: "Pixel 7 Pro" },
        { value: "Pixel 7a", label: "Pixel 7a" },
        { value: "Pixel Fold", label: "Pixel Fold" },
    ],
    // Apple Tablets
    "Apple-Tablets": [
        { value: "iPad Pro 12.9 (6th Gen)", label: "iPad Pro 12.9 (6th Gen)" },
        { value: "iPad Pro 11 (4th Gen)", label: "iPad Pro 11 (4th Gen)" },
        { value: "iPad Air (5th Gen)", label: "iPad Air (5th Gen)" },
        { value: "iPad (10th Gen)", label: "iPad (10th Gen)" },
        { value: "iPad mini (6th Gen)", label: "iPad mini (6th Gen)" },
    ],
    // Consoles
    "Sony-Consoles": [
        { value: "PlayStation 5 Disc", label: "PlayStation 5 Disc" },
        { value: "PlayStation 5 Digital", label: "PlayStation 5 Digital" },
        { value: "PlayStation 5 Slim", label: "PlayStation 5 Slim" },
        { value: "PlayStation 4 Pro", label: "PlayStation 4 Pro" },
    ],
    "Microsoft-Consoles": [
        { value: "Xbox Series X", label: "Xbox Series X" },
        { value: "Xbox Series S", label: "Xbox Series S" },
    ],
    "Nintendo-Consoles": [
        { value: "Switch OLED", label: "Switch OLED" },
        { value: "Switch V2", label: "Switch V2" },
        { value: "Switch Lite", label: "Switch Lite" },
    ],
    // Apple Smartwatches
    "Apple-Smartwatches": [
        { value: "Apple Watch Ultra 2", label: "Apple Watch Ultra 2" },
        { value: "Apple Watch Series 9", label: "Apple Watch Series 9" },
        { value: "Apple Watch SE (2nd Gen)", label: "Apple Watch SE (2nd Gen)" },
    ],
};

export function getBrandsByCategory(category: string) {
    return CATEGORY_BRANDS[category] || [];
}

export function getModelsByBrandCategory(brand: string, category: string) {
    const key = `${brand}-${category}`;
    return BRAND_MODELS[key] || [];
}
