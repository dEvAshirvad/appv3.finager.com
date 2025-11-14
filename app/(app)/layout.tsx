"use client";

import DashHeader from "@/components/header/dash-header";
import { Authenticated } from "@/components/providers/auth-provider";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/queries/auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";

function AppLayout({ children }: { children: React.ReactNode }) {
	const { data, isFetched, isLoading } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (isFetched && !isLoading && data) {
			if (!data.user?.isOnboarded) {
				toast.error(
					"You are not onboarded. Please complete the onboarding process."
				);
				router.push("/onboarding");
			}
		}
	}, [isFetched, isLoading, data, router]);

	// Show skeleton while loading, fetching, or if user is not onboarded
	if (isLoading || !isFetched) {
		return <Skeleton className="h-screen w-full" />;
	}

	// Show skeleton if user is not onboarded (prevents flash during redirect)
	if (data && !data.user?.isOnboarded) {
		return <Skeleton className="h-screen w-full" />;
	}

	// Only render content if user is onboarded
	return (
		<Authenticated>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<DashHeader />
					{children}
				</SidebarInset>
			</SidebarProvider>
		</Authenticated>
	);
}

export default AppLayout;
