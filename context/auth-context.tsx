"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
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
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            if (data) setProfile(data);
        };

        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
