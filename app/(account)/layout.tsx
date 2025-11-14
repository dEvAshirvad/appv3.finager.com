import DashHeader from "@/components/header/dash-header";
import { AccountSidebar } from "@/components/sidebar/account-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

function AccountLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AccountSidebar />
			<SidebarInset>
				<DashHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}

export default AccountLayout;
