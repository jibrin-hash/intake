"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomer, updateCustomer } from "@/app/actions/customers";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { Tables } from "@/lib/database.types";
import { Separator } from "@/components/ui/separator";

export default function EditCustomerPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customer, setCustomer] = useState<Tables<"customers"> | null>(null);

    useEffect(() => {
        if (id) {
            getCustomer(id).then(data => {
                if (data) setCustomer(data);
                else setError("Customer not found");
                setLoading(false);
            });
        }
    }, [id]);

    async function handleSubmit(formData: FormData) {
        if (!id) return;
        setSaving(true);
        setError(null);

        const result = await updateCustomer(id, formData);

        if (result.error) {
            setError(result.error);
        } else {
            // Updated successfully
            alert("Customer updated successfully");
            setCustomer(result.customer); // Update local state
            router.refresh();
        }
        setSaving(false);
    }

    if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin" /></div>;
    if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/customers">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Customer: {customer.first_name} {customer.last_name}</h1>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                    ID: {customer.id.slice(0, 8)}
                </div>
            </div>

            <div className="p-6 border rounded-lg shadow-sm bg-card">
                <form
                    key={customer.updated_at}
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleSubmit(formData);
                    }}
                    className="space-y-6"
                >

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Contact Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input id="first_name" name="first_name" required defaultValue={customer.first_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input id="last_name" name="last_name" required defaultValue={customer.last_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={customer.email || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" type="tel" defaultValue={customer.phone || ""} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Address - Required for LeadsOnline */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Address
                            <span className="text-xs font-normal text-muted-foreground py-0.5 px-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">Required for Compliance</span>
                        </h3>
                        <div className="space-y-2">
                            <Label htmlFor="address_line_1">Street Address</Label>
                            <Input id="address_line_1" name="address_line_1" placeholder="123 Main St" defaultValue={customer.address_line_1 || ""} />
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                            <div className="space-y-2 col-span-3">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" placeholder="Springfield" defaultValue={customer.city || ""} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" name="state" placeholder="IL" maxLength={2} defaultValue={customer.state || ""} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="postal_code">Zip Code</Label>
                                <Input id="postal_code" name="postal_code" placeholder="62704" defaultValue={customer.postal_code || ""} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Identity & Physical - Required for LeadsOnline */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Identity & Physical Description
                            <span className="text-xs font-normal text-muted-foreground py-0.5 px-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">Required</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="id_type">ID Type *</Label>
                                <select
                                    id="id_type"
                                    name="id_type"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    required
                                    defaultValue={customer.id_type}
                                >
                                    <option value="driver_license">Driver License</option>
                                    <option value="state_id">State ID</option>
                                    <option value="passport">Passport</option>
                                    <option value="matricula_consular">Matricula Consular</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="id_number">ID Number *</Label>
                                <Input id="id_number" name="id_number" required defaultValue={customer.id_number} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" name="dob" type="date" defaultValue={customer.dob || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender (Sex)</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    defaultValue={customer.gender || ""}
                                >
                                    <option value="">Select...</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="race">Race</Label>
                                <select
                                    id="race"
                                    name="race"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    defaultValue={customer.race || ""}
                                >
                                    <option value="">Select...</option>
                                    <option value="Caucasian">Caucasian</option>
                                    <option value="Black">Black/African American</option>
                                    <option value="Hispanic">Hispanic/Latino</option>
                                    <option value="Asian">Asian</option>
                                    <option value="Native American">Native American</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height">Height (inches)</Label>
                                <Input id="height" name="height" type="number" placeholder="70" defaultValue={customer.height || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (lbs)</Label>
                                <Input id="weight" name="weight" type="number" placeholder="180" defaultValue={customer.weight || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eye_color">Eye Color</Label>
                                <Input id="eye_color" name="eye_color" placeholder="Brown" defaultValue={customer.eye_color || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hair_color">Hair Color</Label>
                                <Input id="hair_color" name="hair_color" placeholder="Brown" defaultValue={customer.hair_color || ""} />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
