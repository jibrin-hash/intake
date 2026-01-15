"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createIntake } from "@/app/actions/intake";
import { searchCustomers } from "@/app/actions/customers"; // Re-use search action
import { Loader2, Search, UserPlus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tables } from "@/lib/database.types";

export default function StartIntakePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const customerId = searchParams.get("customerId");
    const [error, setError] = useState<string | null>(null);
    const [initLoading, setInitLoading] = useState(false);

    // Search State
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Tables<"customers">[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (customerId) {
            setInitLoading(true);
            createIntake(customerId)
                .then((intake) => {
                    router.push(`/dashboard/intake/${intake.id}`);
                })
                .catch((err) => {
                    console.error("Intake Validated Error:", err);
                    setError(err.message || "Failed to start intake");
                    setInitLoading(false);
                });
        }
    }, [customerId, router]);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                setIsSearching(true);
                try {
                    const data = await searchCustomers(query);
                    setResults(data);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Manual search handler (optional now)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Effect handles it
    };

    if (customerId && initLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Initializing Intake Session...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="flex items-center gap-2 text-destructive font-bold text-xl">
                    <AlertCircle />
                    <span>Error Starting Intake</span>
                </div>
                <p className="text-muted-foreground max-w-md text-center bg-muted p-4 rounded text-sm font-mono">
                    {error}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
                <Button onClick={() => router.push("/dashboard/customers")} variant="link">Back to Customers</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">New Intake</h1>
                <p className="text-muted-foreground">Select a customer to begin processing items.</p>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <Input
                        placeholder="Search Customer by Name, Email or Phone..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                    <span className="ml-2">Search</span>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/customers/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        New Customer
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((customer) => (
                    <div key={customer.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors flex flex-col justify-between gap-4">
                        <div>
                            <h3 className="font-semibold">{customer.first_name} {customer.last_name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <Button asChild className="w-full">
                            <Link href={`/dashboard/intake/new?customerId=${customer.id}`}>
                                Start Intake
                            </Link>
                        </Button>
                    </div>
                ))}
                {results.length === 0 && query && !isSearching && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                        No customers found. <Link href="/dashboard/customers/new" className="underline text-primary">Create a new profile.</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
