import { LoginForm } from "@/components/login-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="relative w-48 h-16">
          <Image
            src="/rce-logo.svg"
            alt="RCE Intake"
            fill
            className="object-contain invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
            priority
          />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
