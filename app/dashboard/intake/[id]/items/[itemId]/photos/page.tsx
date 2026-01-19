"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getItem, getItemImages, saveItemImage, deleteItemImage } from "@/app/actions/intake";
import { createClient } from "@/lib/supabase/client"; // Need client-side for storage
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Upload, Trash2, Camera } from "lucide-react";
import Link from "next/link";
import { Tables } from "@/lib/database.types";
import Image from "next/image";

export default function PhotoManagerPage() {
    const { id, itemId } = useParams<{ id: string; itemId: string }>();
    const router = useRouter();
    const [item, setItem] = useState<Tables<"items"> | null>(null);
    const [images, setImages] = useState<Tables<"item_images">[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (itemId) {
            Promise.all([
                getItem(itemId),
                getItemImages(itemId)
            ]).then(([itemData, imagesData]) => {
                if (itemData) setItem(itemData);
                setImages(imagesData || []);
                setLoading(false);
            }).catch(err => {
                console.error("Failed to load photo manager:", err);
                alert("Error loading page. Please refresh.");
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [itemId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !itemId) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${itemId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage with timeout
            const uploadPromise = supabase.storage
                .from('intake-photos')
                .upload(filePath, file);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Upload timed out after 15s")), 15000)
            );

            const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

            if (uploadError) throw uploadError;

            // 2. Save record to DB
            const res = await saveItemImage(itemId, filePath);
            if (res.error) throw new Error(res.error);

            // Refresh images
            const newImages = await getItemImages(itemId);
            setImages(newImages || []);
        } catch (err: any) {
            console.error("Upload process failed:", err);
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm("Delete this photo?")) return;

        await deleteItemImage(imageId);
        // Optimistic UI update or refresh
        setImages(images.filter(img => img.id !== imageId));
    };

    if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (!item) return <div className="p-12">Item not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/intake/${id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Add Photos</h1>
                        <p className="text-muted-foreground">
                            {item.brand} {item.model} <span className="text-xs bg-muted px-2 py-0.5 rounded ml-2">{item.serial_number}</span>
                        </p>
                    </div>
                </div>
                <Button variant="default" asChild>
                    <Link href={`/dashboard/intake/${id}`}>
                        Done
                    </Link>
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Upload Area */}
                <div className="md:col-span-1">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors h-full min-h-[300px]">

                        <div className="mb-4 p-4 bg-primary/10 rounded-full">
                            {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Camera className="h-8 w-8 text-primary" />}
                        </div>

                        <h3 className="font-semibold text-lg mb-2">Upload Photo</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                            Take a photo with your device or upload from gallery.
                        </p>

                        <Button disabled={uploading} className="w-full max-w-[200px] relative">
                            {uploading ? "Uploading..." : "Select File"}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </Button>
                    </div>
                </div>

                {/* Gallery Area */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        Gallery
                        <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {images.length}
                        </span>
                    </h3>

                    {images.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center border rounded-xl bg-card text-muted-foreground">
                            No photos added yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img) => (
                                <div key={img.id} className="relative group aspect-square border rounded-lg overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all">
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/intake-photos/${img.storage_path}`}
                                        alt="Item Photo"
                                        fill
                                        className="object-cover"
                                    />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                        <button
                                            onClick={() => handleDelete(img.id)}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                                            title="Delete Photo"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
