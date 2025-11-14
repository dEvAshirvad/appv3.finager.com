"use client";

import {
	createContext,
	useContext,
	ReactNode,
	useEffect,
	useMemo,
} from "react";
import { useSession, Session, User } from "@/queries/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function Authenticated({ children }: { children: ReactNode }) {
	const { data, isLoading, error, isFetched } = useSession();
	const router = useRouter();

	const value: AuthContextType = useMemo(() => {
		return {
			user: data?.user || null,
			session: data?.session || null,
			isAuthenticated: !!data?.session,
			isLoading,
			error: error as Error | null,
		};
	}, [data, isLoading, error]);

	// Handle authentication check in useEffect to avoid setState during render
	useEffect(() => {
		if (!isLoading && !data?.session && isFetched) {
			toast.error("You are not authenticated");
			router.push("/auth/signin");
		}
	}, [isLoading, data?.session, router, isFetched]);

	// Don't render children if not authenticated (navigation will happen in useEffect)
	if (!data?.session) {
		return <div>Loading...</div>;
	}

	// Show loading state while checking authentication
	if (isLoading) {
		return <div>Loading...</div>;
	}
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
