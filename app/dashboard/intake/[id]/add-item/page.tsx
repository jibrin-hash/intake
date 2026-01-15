"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { addItem } from "@/app/actions/intake";
import { getExistingCategories, getExistingBrands, getExistingModels } from "@/app/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { ITEM_CATEGORIES, getBrandsByCategory, getModelsByBrandCategory } from "@/lib/constants/items";
import { toast } from "sonner";

export default function AddItemPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");

    // Dynamic Options State
    const [dynamicCategories, setDynamicCategories] = useState<ComboboxOption[]>([]);
    const [dynamicBrands, setDynamicBrands] = useState<ComboboxOption[]>([]);
    const [dynamicModels, setDynamicModels] = useState<ComboboxOption[]>([]);

    // 1. Fetch Categories on Mount
    useEffect(() => {
        getExistingCategories().then(cats => {
            setDynamicCategories(cats);
        });
    }, []);

    // 2. Fetch Brands when Category changes
    useEffect(() => {
        if (category) {
            getExistingBrands(category).then(brands => {
                setDynamicBrands(brands);
            });
        } else {
            setDynamicBrands([]);
        }
    }, [category]);

    // 3. Fetch Models when Brand/Category changes
    useEffect(() => {
        if (brand) {
            getExistingModels(brand, category).then(models => {
                setDynamicModels(models);
            });
        } else {
            setDynamicModels([]);
        }
    }, [brand, category]);

    // Merge Helper
    const mergeOptions = (staticOpts: ComboboxOption[], dynamicOpts: ComboboxOption[]) => {
        const map = new Map();
        staticOpts.forEach(o => map.set(o.value, o));
        dynamicOpts.forEach(o => map.set(o.value, o)); // Dynamic overwrites or adds
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    };

    const categoryOptions = mergeOptions(ITEM_CATEGORIES, dynamicCategories);
    const brandOptions = mergeOptions(getBrandsByCategory(category), dynamicBrands);
    const modelOptions = mergeOptions(getModelsByBrandCategory(brand, category), dynamicModels);

    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(formData: FormData) {
        if (!id) return;
        setLoading(true);
        setError(null);

        // Ensure combobox values are in formData
        formData.set("category", category);
        formData.set("brand", brand);
        formData.set("model", model);

        // Custom Validation
        const requiredFields = [];
        if (!category) requiredFields.push("Category");
        if (!brand) requiredFields.push("Brand");
        if (!model) requiredFields.push("Model");
        if (!formData.get("serial_number")) requiredFields.push("Serial Number");
        if (!formData.get("purchase_price")) requiredFields.push("Purchase Price");

        if (requiredFields.length > 0) {
            const errorMsg = `Please fill out: ${requiredFields.join(", ")}`;
            toast.error(errorMsg);
            setError(errorMsg); // Optional: keep visual inline error too if desired
            setLoading(false);
            return;
        }

        const result = await addItem(id, formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Success! 
            // 1. Reset React State
            setCategory("");
            setBrand("");
            setModel("");

            // 2. Reset Native Form Inputs (Price, Serial, etc.)
            formRef.current?.reset();

            // 3. Stop loading spinner so it doesn't spin forever during redirect
            setLoading(false);

            // 4. Redirect to photo upload page
            router.push(`/dashboard/intake/${id}/items/${result.item.id}/photos`);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/intake/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Add Item to Intake</h1>
            </div>

            <div className="p-6 border rounded-lg shadow-sm bg-card">
                <form ref={formRef} action={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Combobox
                                options={categoryOptions}
                                value={category}
                                onChange={(val) => {
                                    setCategory(val);
                                    setBrand(""); // Reset downstream
                                    setModel("");
                                }}
                                onCreate={(val) => {
                                    setCategory(val);
                                    setBrand("");
                                    setModel("");
                                }}
                                placeholder="Select category..."
                            />
                            {/* Fallback hidden input isn't strictly needed if we intercept formData, but good for safety */}
                            <input type="hidden" name="category" value={category} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand *</Label>
                            <Combobox
                                options={brandOptions}
                                value={brand}
                                onChange={(val) => {
                                    setBrand(val);
                                    setModel(""); // Reset downstream
                                }}
                                onCreate={(val) => {
                                    setBrand(val);
                                    setModel("");
                                }}
                                placeholder={category ? "Select brand..." : "Select category first"}
                                disabled={!category}
                            />
                            <input type="hidden" name="brand" value={brand} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="model">Model *</Label>
                        <Combobox
                            options={modelOptions}
                            value={model}
                            onChange={setModel}
                            onCreate={setModel}
                            placeholder={brand ? "Select or enter model..." : "Select brand first"}
                            disabled={!brand}
                        />
                        <input type="hidden" name="model" value={model} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serial_number">Serial Number / ISBN *</Label>
                        <Input id="serial_number" name="serial_number" placeholder="Unique Identifier" required />
                        <p className="text-xs text-muted-foreground">Scan barcode if available.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_price">Purchase Price ($) *</Label>
                            <Input id="purchase_price" name="purchase_price" type="number" step="0.01" min="0" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition</Label>
                            <select
                                id="condition"
                                name="condition"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="Like New">Like New</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                                <option value="Damaged">Damaged</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Notes / Descriptions</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Detailed physical description, scratches, dents..."
                        />
                    </div>

                    {/* Photo upload will happen next */}

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Add Photos
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
