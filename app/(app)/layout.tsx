import DashHeader from "@/components/header/dash-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<DashHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}

export default AppLayout;
