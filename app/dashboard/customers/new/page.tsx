"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomer } from "@/app/actions/customers";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        // Basic Client Validation
        const firstName = formData.get("first_name");
        const lastName = formData.get("last_name");
        const idNumber = formData.get("id_number");

        if (!firstName || !lastName || !idNumber) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        const result = await createCustomer(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Redirect to intake with new customer
            router.push(`/dashboard/intake/new?customerId=${result.customer?.id}`);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">New Customer Profile</h1>
            </div>

            <div className="p-6 border rounded-lg shadow-sm bg-card">
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input id="first_name" name="first_name" required placeholder="John" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input id="last_name" name="last_name" required placeholder="Doe" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <h3 className="font-semibold">Identity Verification</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Government issued ID is required for all sellers.
                        </p>

                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="id_type">ID Type *</Label>
                                <select
                                    id="id_type"
                                    name="id_type"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
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
                                <Input id="id_number" name="id_number" required placeholder="D12345678" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Custom Profile
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
