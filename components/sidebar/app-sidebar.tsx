"use client";

import * as React from "react";
import {
	BarChart,
	Book,
	Calculator,
	FileText,
	Home,
	IndianRupee,
	LifeBuoy,
	Package,
	Send,
	ShoppingCart,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: Home,
		},
		{
			title: "Items",
			url: "/items",
			icon: Package,
		},
		{
			title: "Sales",
			url: "/sales/customers",
			icon: IndianRupee,
			isActive: true,
			items: [
				{
					title: "Customers",
					url: "/sales/customers",
				},
				{
					title: "Invoices",
					url: "/sales/invoices",
				},
				{
					title: "Payments Received",
					url: "/sales/payments-received",
				},
			],
		},
		{
			title: "Purchases",
			url: "/purchases/suppliers",
			icon: ShoppingCart,
			items: [
				{
					title: "Suppliers",
					url: "/purchases/suppliers",
				},
				{
					title: "Bills",
					url: "/purchases/bills",
				},
				{
					title: "Payments Made",
					url: "/purchases/payment-made",
				},
			],
		},
		{
			title: "GST",
			url: "/gst/reconcile",
			icon: FileText,
		},
		{
			title: "Accountant",
			url: "/accountant/manual-journal",
			icon: Calculator,
			items: [
				{
					title: "Manual Journal",
					url: "/accountant/manual-journal",
				},
				{
					title: "Chart of Accounts",
					url: "/accountant/chart-of-accounts",
				},
			],
		},
		{
			title: "Reports",
			url: "/reports",
			icon: BarChart,
			items: [
				{
					title: "Profit and Loss",
					url: "/reports/profit-and-loss",
				},
				{
					title: "Balance Sheet",
					url: "/reports/balance-sheet",
				},
				{
					title: "Trial Balance",
					url: "/reports/trial-balance",
				},
				{
					title: "Net Income",
					url: "/reports/net-income",
				},
				{
					title: "Cash Flow",
					url: "/reports/cash-flow",
				},
				{
					title: "GSTR-1 Reports",
					url: "/reports/gst/gstr1",
				},
				{
					title: "GSTR-2 Reports",
					url: "/reports/gst/gstr2",
				},
				{
					title: "GSTR-3B Reports",
					url: "/reports/gst/gstr3b",
				},
			],
		},
	],
	// navSecondary: [
	// 	{
	// 		title: "Support",
	// 		url: "#",
	// 		icon: LifeBuoy,
	// 	},
	// 	{
	// 		title: "Feedback",
	// 		url: "#",
	// 		icon: Send,
	// 	},
	// ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const isActive = (url: string) => pathname.startsWith(url);

	const navMain = data.navMain.map((item) => ({
		...item,
		isActive: isActive(item.url),
	}));
	return (
		<Sidebar {...props}>
			<SidebarHeader className="border-b">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Book className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">Finager India</span>
									<span className="truncate text-xs">v1.0</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
				{/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
			</SidebarContent>
		</Sidebar>
	);
}
