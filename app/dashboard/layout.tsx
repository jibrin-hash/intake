import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Middleware handles protection.
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <aside className="hidden md:flex flex-col h-full w-64 flex-shrink-0">
                <AppSidebar />
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
