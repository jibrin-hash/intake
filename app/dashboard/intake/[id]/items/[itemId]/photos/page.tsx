"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getItem, getItemImages, saveItemImage, deleteItemImage } from "@/app/actions/intake";
import { createClient } from "@/lib/supabase/client"; // Need client-side for storage
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trash2, Camera } from "lucide-react";
import Link from "next/link";
import { Tables } from "@/lib/database.types";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PhotoManagerPage() {
    const { id, itemId } = useParams<{ id: string; itemId: string }>();
    const [item, setItem] = useState<Tables<"items"> | null>(null);
    const [images, setImages] = useState<Tables<"item_images">[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { user, profile, loading: authLoading } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            if (!itemId || !UUID_REGEX.test(itemId) || !id || !UUID_REGEX.test(id)) {
                console.warn("[PhotoManagerPage] Malformed IDs detected (likely system placeholders). Waiting for resolution...", { id, itemId });
                return;
            }

            try {
                const [itemData, imagesData] = await Promise.all([
                    getItem(itemId),
                    getItemImages(itemId)
                ]);

                if (itemData) setItem(itemData);
                setImages(imagesData || []);
            } catch (err) {
                console.error("Failed to load photo manager:", err);
                alert("Error loading page. Please refresh.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, itemId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !itemId) return;
        const file = e.target.files[0];
        
        // --- PRE-UPLOAD DIAGNOSTICS ---
        console.log("[handleUpload] --- STARTING UPLOAD ---");
        
        // Force a session refresh/check directly from Supabase to bypass potentially stale context
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const activeUser = freshUser || user;

        console.log("[handleUpload] ItemId:", itemId);
        console.log("[handleUpload] Auth Context User ID:", user?.id);
        console.log("[handleUpload] Fresh Supabase User ID:", freshUser?.id);
        console.log("[handleUpload] Profile Role:", profile?.role);
        console.log("[handleUpload] Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("[handleUpload] File info:", { 
            name: file.name, 
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, 
            type: file.type 
        });

        if (!activeUser) {
            console.error("[handleUpload] ERROR: No authenticated user found.");
            toast.error("Upload failed: You must be logged in.");
            return;
        }

        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${itemId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;
            
            console.log("[handleUpload] Target Path:", filePath);

            // 1. Upload to Storage
            // NOTE: We don't use 'e.target.disabled = true' immediately to avoid 
            // potential browser context loss that might trigger an AbortSignal.
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('intake-photos')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.group("[handleUpload] Supabase Upload Error Details");
                console.error("Error Object:", uploadError);
                console.error("Message:", uploadError.message);
                console.error("Name:", (uploadError as { name?: string }).name);
                console.groupEnd();
                throw uploadError;
            }
            
            console.log("[handleUpload] Storage upload successful:", uploadData);

            // 2. Save record to DB
            const res = await saveItemImage(itemId, filePath);
            if (res.error) {
                console.error("[handleUpload] DB Record save error:", res.error);
                throw new Error(res.error);
            }
            console.log("[handleUpload] Database record saved.");

            // Refresh UI
            const newImages = await getItemImages(itemId);
            setImages(newImages || []);
            toast.success("Photo uploaded successfully.");
        } catch (err: unknown) {
            console.group("[handleUpload] FAILED");
            console.error("Caught error:", err);
            
            const error = err as Error;
            // Special handling for Abort errors
            const isAbort = error?.message?.includes("aborted") || error?.name === "AbortError";
            if (isAbort) {
                console.warn("[handleUpload] PROMPT: The request was aborted by the network or browser.");
            }
            
            console.groupEnd();
            
            const message = error?.message || String(err);
            alert(`Upload failed: ${message}\n\nPlease try again or check your internet connection.`);
        } finally {
            setUploading(false);
            // Reset input after completion
            if (e.target) e.target.value = "";
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm("Delete this photo?")) return;

        await deleteItemImage(imageId);
        // Optimistic UI update or refresh
        setImages(images.filter(img => img.id !== imageId));
    };

    if (loading || authLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
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

                        <Button disabled={uploading} className="w-full max-w-[200px] relative pointer-events-auto">
                            {uploading ? "Uploading..." : "Select File"}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={handleUpload}
                                // We don't disable the input itself, only the wrapper Button 
                                // to avoid potential browser termination of the onChange stream.
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
