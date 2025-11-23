"use client";
import React, { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Loader2 } from "lucide-react";
import { useSession } from "@/queries/auth";
import { useRouter } from "next/navigation";
import { useFullOrganization } from "@/queries/organization";
import { useInvoiceList, InvoiceStatus } from "@/queries/invoices";
import { useBillList, BillStatus } from "@/queries/bills";
import { useContactList, ContactType, ContactStatus } from "@/queries/contacts";

function Dashboard() {
	const router = useRouter();
	const { data: sessionData } = useSession();
	const { data: organizationData } = useFullOrganization();
	const organizationId = sessionData?.session?.activeOrganizationId;

	// Fetch unpaid invoices (receivables)
	const { data: invoicesData, isLoading: isLoadingInvoices } = useInvoiceList({
		organizationId,
		status: InvoiceStatus.DRAFT,
		page: 1,
		limit: 50, // Get all for calculation
	});

	// Fetch partially paid invoices
	const { data: partiallyPaidInvoicesData } = useInvoiceList({
		organizationId,
		status: InvoiceStatus.PARTIALLY_PAID,
		page: 1,
		limit: 10,
	});

	// Fetch unpaid bills (payables)
	const { data: billsData, isLoading: isLoadingBills } = useBillList({
		status: BillStatus.DRAFT,
		page: 1,
		limit: 10,
	});

	// Fetch partially paid bills
	const { data: partiallyPaidBillsData } = useBillList({
		status: BillStatus.PARTIALLY_PAID,
		page: 1,
		limit: 10,
	});

	// Fetch customers count
	const { data: customersData } = useContactList({
		organizationId,
		type: ContactType.CUSTOMER,
		status: ContactStatus.ACTIVE,
		page: 1,
		limit: 1,
	});

	// Calculate receivables
	const receivables = useMemo(() => {
		const allInvoices = [
			...(invoicesData?.data?.docs || []),
			...(partiallyPaidInvoicesData?.data?.docs || []),
		];
		const now = new Date();
		let total = 0;
		let current = 0;
		let overdue = 0;

		allInvoices.forEach((invoice) => {
			const balance = invoice.balance || 0;
			total += balance;

			if (invoice.dueDate) {
				const dueDate = new Date(invoice.dueDate);
				if (dueDate < now) {
					overdue += balance;
				} else {
					current += balance;
				}
			} else {
				current += balance;
			}
		});

		return { total, current, overdue };
	}, [invoicesData, partiallyPaidInvoicesData]);

	// Calculate payables
	const payables = useMemo(() => {
		const allBills = [
			...(billsData?.data?.docs || []),
			...(partiallyPaidBillsData?.data?.docs || []),
		];
		const now = new Date();
		let total = 0;
		let current = 0;
		let overdue = 0;

		allBills.forEach((bill) => {
			const balance = bill.balance || 0;
			total += balance;

			if (bill.dueDate) {
				const dueDate = new Date(bill.dueDate);
				if (dueDate < now) {
					overdue += balance;
				} else {
					current += balance;
				}
			} else {
				current += balance;
			}
		});

		return { total, current, overdue };
	}, [billsData, partiallyPaidBillsData]);

	const isLoading = isLoadingInvoices || isLoadingBills;

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
						{isLoading ? (
							<div className="flex items-center justify-center h-64">
								<Loader2 className="h-8 w-8 animate-spin" />
							</div>
						) : (
							<>
								{/* Financial Overview Cards */}
								<div className="grid grid-cols-2 gap-6">
									{/* Total Receivables */}
									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Total Receivables
											</CardTitle>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => router.push("/sales/invoices")}>
												<Plus className="h-4 w-4" />
											</Button>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{formatCurrency(receivables.total)}
											</div>
											<p className="text-xs text-muted-foreground">
												Total Unpaid Invoices
											</p>
											<div className="mt-2 flex gap-4 text-xs">
												<span className="text-muted-foreground">
													Current: {formatCurrency(receivables.current)}
												</span>
												<span className="text-destructive">
													Overdue: {formatCurrency(receivables.overdue)}
												</span>
											</div>
										</CardContent>
									</Card>

									{/* Total Payables */}
									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Total Payables
											</CardTitle>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => router.push("/purchases/bills")}>
												<Plus className="h-4 w-4" />
											</Button>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{formatCurrency(payables.total)}
											</div>
											<p className="text-xs text-muted-foreground">
												Total Unpaid Bills
											</p>
											<div className="mt-2 flex gap-4 text-xs">
												<span className="text-muted-foreground">
													Current: {formatCurrency(payables.current)}
												</span>
												<span className="text-destructive">
													Overdue: {formatCurrency(payables.overdue)}
												</span>
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Quick Stats */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">
												Total Customers
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{customersData?.data?.totalDocs || 0}
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">
												Total Invoices
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(invoicesData?.data?.totalDocs || 0) +
													(partiallyPaidInvoicesData?.data?.totalDocs || 0)}
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">
												Total Bills
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(billsData?.data?.totalDocs || 0) +
													(partiallyPaidBillsData?.data?.totalDocs || 0)}
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">
												Net Position
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div
												className={`text-2xl font-bold ${
													receivables.total - payables.total >= 0
														? "text-green-600"
														: "text-red-600"
												}`}>
												{formatCurrency(receivables.total - payables.total)}
											</div>
										</CardContent>
									</Card>
								</div>
							</>
						)}
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
