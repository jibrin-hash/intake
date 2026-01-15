"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PlusCircle,
    Users,
    Package,
    ShieldAlert,
    Settings,
    LogOut,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "New Intake", href: "/dashboard/intake/new", icon: PlusCircle },
    { name: "Drafts", href: "/dashboard/drafts", icon: FileText },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Hold Queue", href: "/dashboard/hold-queue", icon: ShieldAlert },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full border-r bg-muted/10 w-64">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold tracking-tight">RCE Intake</h1>
                <p className="text-xs text-muted-foreground">Compliance System</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    // Simple logic:
                    // 1. Exact match always wins
                    // 2. "Dashboard" (root) should not steal focus from sub-pages like /dashboard/inventory
                    //    So if item.href is just "/dashboard", we strictly require it to be "/dashboard"
                    const isActive = item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon size={18} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                    <ThemeSwitcher />
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="icon" title="Sign Out">
                            <LogOut size={18} />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
