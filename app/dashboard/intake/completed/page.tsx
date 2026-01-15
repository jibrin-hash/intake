import { Button } from "@/components/ui/button";
import { CheckCircle, Home, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function IntakeCompletedPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="rounded-full bg-green-100 p-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Intake Completed</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    The items have been successfully processed and placed on the 30-day compliance hold.
                </p>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" asChild>
                    <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/dashboard/customers">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Intake
                    </Link>
                </Button>
            </div>
        </div>
    );
}
