import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile if needed, or just use auth data for now

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and system preferences.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your personal account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user?.email || ""} disabled />
                            <p className="text-[0.8rem] text-muted-foreground">Contact admin to change email.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Input id="role" value="Staff Member" disabled />
                            {/* In future we can fetch real role from profiles table */}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Preferences</CardTitle>
                        <CardDescription>Configure local application behavior.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Dark Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Toggle theme via the button in the bottom-left sidebar.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Store Configuration</CardTitle>
                        <CardDescription>Global settings for this location.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Default Hold Duration</Label>
                            <Input value="14 Days" disabled />
                            <p className="text-[0.8rem] text-muted-foreground">Defined by compliance policy.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
