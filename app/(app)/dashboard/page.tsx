"use client";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DollarSign,
	CreditCard,
	Plus,
	ChevronDown,
	Download,
	RefreshCw,
	Users,
	FileText,
	ShoppingCart,
	Activity,
} from "lucide-react";
import { useSession } from "@/queries/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFullOrganization } from "@/queries/organization";

// Sample data for the dashboard
const dashboardData = {
	receivables: {
		total: 0,
		current: 0,
		overdue: 0,
	},
	payables: {
		total: 0,
		current: 0,
		overdue: 0,
	},
	cashFlow: {
		openingBalance: 0,
		incoming: 0,
		outgoing: 0,
		closingBalance: 0,
		monthlyData: [
			{ month: "Apr 2025", amount: 0 },
			{ month: "May 2025", amount: 0 },
			{ month: "Jun 2025", amount: 0 },
			{ month: "Jul 2025", amount: 0 },
			{ month: "Aug 2025", amount: 0 },
			{ month: "Sep 2025", amount: 0 },
			{ month: "Oct 2025", amount: 0 },
			{ month: "Nov 2025", amount: 0 },
			{ month: "Dec 2025", amount: 0 },
			{ month: "Jan 2026", amount: 0 },
			{ month: "Feb 2026", amount: 0 },
			{ month: "Mar 2026", amount: 0 },
		],
	},
	recentActivities: [
		{
			id: 1,
			type: "invoice",
			description: "Invoice #INV-001 created",
			amount: 25000,
			date: "2024-01-15",
			status: "sent",
		},
		{
			id: 2,
			type: "payment",
			description: "Payment received from Customer A",
			amount: 15000,
			date: "2024-01-14",
			status: "completed",
		},
		{
			id: 3,
			type: "expense",
			description: "Office supplies purchased",
			amount: 5000,
			date: "2024-01-13",
			status: "pending",
		},
	],
	quickStats: {
		totalCustomers: 0,
		totalInvoices: 0,
		totalOrders: 0,
		totalExpenses: 0,
	},
};

function Dashboard() {
	const { data: sessionData } = useSession();
	const { data: organizationData } = useFullOrganization();
	const [selectedPeriod, setSelectedPeriod] = useState("this-fiscal-year");

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className="">
			<Tabs defaultValue="dashboard" className="gap-0">
				<div className="px-6 space-y-4 pt-6 relative bg-[url('/dashboard-banner.svg')] bg-accent/20 bg-repeat border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Avatar className="size-16 rounded-md">
								<AvatarImage src={sessionData?.user?.image} />
								<AvatarFallback>AS</AvatarFallback>
							</Avatar>
							<div className="flex flex-col gap-0">
								<h1 className="font-semibold text-xl">
									Hello, {sessionData?.user?.name}
								</h1>
								<p className="text-muted-foreground capitalize">
									Organization: {organizationData?.name}
								</p>
							</div>
						</div>
						<div className="text-sm text-muted-foreground text-right">
							<p className="font-semibold text-foreground">
								Finager India Helpline: 18003093036
							</p>
							<p className="text-xs">
								Mon - Fri • 9:00 AM - 7:00 PM • Toll Free
							</p>
							<p className="text-xs">
								English, हिन्दी, தமிழ், తెలుగు, മലയാളം, ಕನ್ನಡ, मराठी, ગુજરાતી,
								বাংলা
							</p>
						</div>
					</div>
					<TabsList className="bg-transparent p-0 h-14">
						<TabsTrigger
							value="dashboard"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary rounded-none text-base">
							Dashboard
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="dashboard">
					<div className="p-6 space-y-6">
						{/* Financial Overview Cards */}
						<div className="grid grid-cols-2 gap-6">
							{/* Total Receivables */}
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Total Receivables
									</CardTitle>
									<Button variant="ghost" size="sm">
										<Plus className="h-4 w-4" />
									</Button>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(dashboardData.receivables.total)}
									</div>
									<p className="text-xs text-muted-foreground">
										Total Unpaid Invoices
									</p>
								</CardContent>
							</Card>

							{/* Total Payables */}
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Total Payables
									</CardTitle>
									<Button variant="ghost" size="sm">
										<Plus className="h-4 w-4" />
									</Button>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(dashboardData.payables.total)}
									</div>
									<p className="text-xs text-muted-foreground">
										Total Unpaid Bills
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="announcements">
					<div className="p-6">
						<h2 className="text-2xl font-semibold mb-4">Announcements</h2>
						<div className="space-y-4">
							<Card>
								<CardContent className="p-4">
									<div className="flex items-start space-x-3">
										<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
										<div>
											<h3 className="font-semibold">
												New Feature: Advanced Reporting
											</h3>
											<p className="text-sm text-muted-foreground mt-1">
												We&apos;ve added advanced reporting features to help you
												better analyze your business performance.
											</p>
											<p className="text-xs text-muted-foreground mt-2">
												2 days ago
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="fiscal-year">
					<div className="p-6">
						<h2 className="text-2xl font-semibold mb-4">
							Fiscal Year-End Tasks
						</h2>
						<div className="space-y-4">
							<Card>
								<CardContent className="p-4">
									<h3 className="font-semibold mb-2">
										Complete Your Year-End Checklist
									</h3>
									<p className="text-sm text-muted-foreground">
										Ensure all your financial records are up to date before the
										fiscal year ends.
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="getting-started">
					<div className="p-6">
						<h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
						<div className="space-y-4">
							<Card>
								<CardContent className="p-4">
									<h3 className="font-semibold mb-2">Welcome to Finager!</h3>
									<p className="text-sm text-muted-foreground">
										Let&apos;s get you started with setting up your business
										profile and importing your data.
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Floating Help Button */}
			<div className="fixed bottom-6 right-6">
				<Button
					size="lg"
					className="rounded-full h-14 w-14 shadow-lg"
					aria-label="Need Assistance?">
					<Activity className="h-6 w-6" />
				</Button>
			</div>
		</div>
	);
}

export default Dashboard;
