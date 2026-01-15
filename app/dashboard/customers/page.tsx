"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { searchCustomers } from "@/app/actions/customers";
import { Tables } from "@/lib/database.types";

export default function CustomersPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Tables<"customers">[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        searchCustomers("").then((data) => {
            setResults(data);
            setLoading(false);
        });
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const data = await searchCustomers(query);
            setResults(data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <p className="text-muted-foreground">Manage seller profiles and intakes.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/customers/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        New Customer
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search by name, email, or phone..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="max-w-md"
                />
                <Button type="submit" disabled={loading}>
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead>
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center h-24 text-muted-foreground">Loading customers...</td>
                                </tr>
                            ) : results.length > 0 ? (
                                results.map((customer) => (
                                    <tr key={customer.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">
                                            {customer.first_name} {customer.last_name}
                                        </td>
                                        <td className="p-4 align-middle">{customer.email || "-"}</td>
                                        <td className="p-4 align-middle">{customer.phone || "-"}</td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${customer.banned ? "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80" : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                                                {customer.banned ? "Banned" : "Active"}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/intake/new?customerId=${customer.id}`}>
                                                    New Intake
                                                </Link>
                                            </Button>
                                            {/* Edit button could go here */}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center h-24 text-muted-foreground">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
