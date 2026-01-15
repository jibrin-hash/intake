'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getItem, updateItem } from "@/app/actions/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tables } from "@/lib/database.types";
import { Combobox } from "@/components/ui/combobox";
import { ITEM_CATEGORIES, getBrandsByCategory, getModelsByBrandCategory } from "@/lib/constants/items";

export default function EditItemPage() {
    const { id, itemId } = useParams<{ id: string; itemId: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [item, setItem] = useState<Tables<"items"> | null>(null);

    // Form State
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");

    // Derived State
    const brandOptions = getBrandsByCategory(category);
    const modelOptions = getModelsByBrandCategory(brand, category);

    useEffect(() => {
        if (itemId) {
            getItem(itemId).then((data) => {
                if (data) {
                    setItem(data);
                    // Initialize form state
                    setCategory(data.category || "");
                    setBrand(data.brand || "");
                    setModel(data.model || "");
                }
                else setError("Item not found");
                setInitLoading(false);
            });
        }
    }, [itemId]);

    async function handleSubmit(formData: FormData) {
        if (!itemId || !id) return;
        setLoading(true);
        setError(null);

        // Ensure combobox values are in formData
        formData.set("category", category);
        formData.set("brand", brand);
        formData.set("model", model);

        const result = await updateItem(itemId, formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push(`/dashboard/intake/${id}`);
        }
    }

    if (initLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (!item) return <div className="p-12 text-destructive">Item not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/intake/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Item</h1>
            </div>

            <div className="p-6 border rounded-lg shadow-sm bg-card">
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Combobox
                                options={ITEM_CATEGORIES}
                                value={category}
                                onChange={(val) => {
                                    setCategory(val);
                                    setBrand("");
                                    setModel("");
                                }}
                                onCreate={(val) => {
                                    setCategory(val);
                                    setBrand("");
                                    setModel("");
                                }}
                                placeholder="Select category..."
                            />
                            <input type="hidden" name="category" value={category} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand *</Label>
                            <Combobox
                                options={brandOptions}
                                value={brand}
                                onChange={(val) => {
                                    setBrand(val);
                                    setModel("");
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
                        <Input id="serial_number" name="serial_number" defaultValue={item.serial_number || ""} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_price">Purchase Price ($) *</Label>
                            <Input id="purchase_price" name="purchase_price" type="number" step="0.01" min="0" defaultValue={item.purchase_price || ""} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition</Label>
                            <select
                                id="condition"
                                name="condition"
                                defaultValue={item.condition || "Good"}
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
                            defaultValue={item.description || ""}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Item
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
