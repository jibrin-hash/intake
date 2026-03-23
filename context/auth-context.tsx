"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isManager: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isManager: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchProfile = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .single();
                if (error) {
                    console.error("[AuthProvider] Profile fetch error:", error);
                }
                if (data) setProfile(data);
            } catch (err) {
                console.error("[AuthProvider] Unexpected profile fetch error:", err);
            }
        };

        const initAuth = async () => {
            try {
                console.log("[AuthProvider] Initializing auth...");
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error("[AuthProvider] Session fetch error:", sessionError);
                }

                console.log("[AuthProvider] Session found on mount:", !!session, session?.user?.id);
                
                setUser(session?.user || null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error("[AuthProvider] Auth initialization error:", err);
            } finally {
                setLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
                console.log("[AuthProvider] Auth state change event:", event, !!session);
                setUser(session?.user || null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            });

            return () => subscription.unsubscribe();
        };

        initAuth();
    }, []);

    const value = {
        user,
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        isManager: profile?.role === "manager" || profile?.role === "admin",
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
