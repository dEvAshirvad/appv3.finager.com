"use client";

import React from "react";
import { format } from "date-fns";
import {
	Loader2,
	Building2,
	Shield,
	Users,
	RefreshCw,
	Printer,
	Mail,
	Download,
	Calendar,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashTitle from "@/components/header/dash-title";
import { useBalanceSheet, AccountBalance } from "@/queries/reports";
import { useSession } from "@/queries/auth";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Summary Card Component
function SummaryCard({
	title,
	amount,
	icon: Icon,
	color,
}: {
	title: string;
	amount: number;
	icon: React.ElementType;
	color: string;
}) {
	return (
		<Card className="rounded-md">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						{title}
					</CardTitle>
					<Icon className={`h-5 w-5 ${color}`} />
				</div>
				<div className="mt-2">
					<p className={`text-3xl font-bold ${color}`}>
						₹{amount.toLocaleString("en-IN")}
					</p>
				</div>
			</CardHeader>
		</Card>
	);
}

// Helper function to calculate total balance recursively
function calculateAccountTotal(account: AccountBalance): number {
	if (!account.children || account.children.length === 0) {
		return account.balance || 0;
	}
	return (
		(account.balance || 0) +
		account.children.reduce(
			(sum, child) => sum + calculateAccountTotal(child),
			0
		)
	);
}

// Recursive Account Tree Component
function AccountTreeRow({
	account,
	level = 0,
}: {
	account: AccountBalance;
	level?: number;
}) {
	const hasChildren = account.children && account.children.length > 0;
	const indentLevel = level * 20; // 20px per level
	const totalBalance = calculateAccountTotal(account);
	const isParent = hasChildren;
	const isLeaf = !hasChildren;

	return (
		<>
			{/* Account Row */}
			<div
				className={`flex items-center justify-between py-1.5 border-b border-border/40 ${
					isParent ? "font-semibold" : ""
				}`}
				style={{ paddingLeft: `${indentLevel}px` }}>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						{isLeaf && (
							<span className="text-sm font-medium text-muted-foreground">
								{account.accountCode}
							</span>
						)}
						<span
							className={`text-sm ${
								isParent ? "font-semibold" : "font-medium"
							}`}>
							{account.accountName}
						</span>
					</div>
				</div>
				<div className="text-right">
					<p
						className={`text-sm ${isParent ? "font-semibold" : "font-medium"}`}>
						{"₹"}
						{totalBalance.toLocaleString("en-IN", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</div>
			{/* Render children recursively */}
			{hasChildren &&
				account.children?.map((child) => (
					<AccountTreeRow
						key={child.accountId}
						account={child}
						level={level + 1}
					/>
				))}
			{/* Show total for parent accounts */}
			{isParent && (
				<div
					className="flex items-center justify-between py-1.5 border-b border-border/60 font-semibold bg-muted/20"
					style={{ paddingLeft: `${indentLevel}px` }}>
					<div className="flex-1">
						<span className="text-sm">Total for {account.accountName}</span>
					</div>
					<div className="text-right">
						<p className="text-sm font-semibold">
							{"₹"}
							{totalBalance.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>
				</div>
			)}
		</>
	);
}

// Section Component for hierarchical structure
function HierarchicalSection({
	title,
	accounts,
	total,
}: {
	title: string;
	accounts: AccountBalance[];
	total: number;
}) {
	if (accounts.length === 0) return null;

	return (
		<div className="space-y-1">
			{/* Section Header */}
			<div className="py-2 border-b-2 border-border">
				<h3 className="text-sm font-semibold uppercase tracking-wide">
					{title}
				</h3>
			</div>
			{/* Render account tree */}
			<div className="space-y-0">
				{accounts.map((account) => (
					<AccountTreeRow key={account.accountId} account={account} level={0} />
				))}
			</div>
			{/* Section Total */}
			<div className="flex items-center justify-between py-3 border-t-2 border-border font-semibold bg-muted/50">
				<span className="text-sm uppercase tracking-wide">
					Total for {title}
				</span>
				<span className="text-sm">
					{"₹"}
					{total.toLocaleString("en-IN", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}
				</span>
			</div>
		</div>
	);
}

export default function BalanceSheetPage() {
	const { data: sessionData } = useSession();
	const [asOfDate, setAsOfDate] = React.useState<string>(
		format(new Date(), "yyyy-MM-dd")
	);

	const { data, isLoading, error, refetch } = useBalanceSheet({
		asOfDate: asOfDate ? new Date(asOfDate).toISOString() : undefined,
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const balanceSheet = data?.data;

	// Use hierarchical accounts directly from API
	// The API now returns accounts with children property
	const assetsAccounts = React.useMemo(() => {
		return balanceSheet?.assets.accounts || [];
	}, [balanceSheet]);

	const liabilitiesAccounts = React.useMemo(() => {
		return balanceSheet?.liabilities.accounts || [];
	}, [balanceSheet]);

	const equityAccounts = React.useMemo(() => {
		return balanceSheet?.equity.accounts || [];
	}, [balanceSheet]);

	const handleRefresh = () => {
		refetch();
	};

	const handlePrint = () => {
		window.print();
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		alert("Export functionality coming soon");
	};

	const handleEmail = () => {
		// TODO: Implement email functionality
		alert("Email functionality coming soon");
	};

	return (
		<div className="space-y-6">
			<DashTitle title="Balance Sheet" />

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
				<SummaryCard
					title="Total Assets"
					amount={balanceSheet?.assets.total || 0}
					icon={Building2}
					color="text-blue-600"
				/>
				<SummaryCard
					title="Total Liabilities"
					amount={balanceSheet?.liabilities.total || 0}
					icon={Shield}
					color="text-red-600"
				/>
				<SummaryCard
					title="Total Equity"
					amount={balanceSheet?.equity.total || 0}
					icon={Users}
					color="text-green-600"
				/>
			</div>

			<div className="px-6 space-y-4">
				{/* Filter and Action Bar */}
				<Card>
					<CardContent className="">
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
							<div className="flex items-center gap-4 flex-1">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<label className="text-sm font-medium">As of Date:</label>
								</div>
								<Input
									type="date"
									value={asOfDate}
									onChange={(e) => setAsOfDate(e.target.value)}
									className="w-auto"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleRefresh}
									disabled={isLoading}>
									<RefreshCw
										className={`h-4 w-4 mr-2 ${
											isLoading ? "animate-spin" : ""
										}`}
									/>
									Refresh
								</Button>
								{/* <Button variant="outline" size="sm" onClick={handlePrint}>
								<Printer className="h-4 w-4 mr-2" />
								Print
							</Button>
							<Button variant="outline" size="sm" onClick={handleEmail}>
								<Mail className="h-4 w-4 mr-2" />
								Email
							</Button>
							<Button variant="outline" size="sm" onClick={handleExport}>
								<Download className="h-4 w-4 mr-2" />
								Export
							</Button> */}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Balance Sheet Status */}
				{balanceSheet && (
					<div className="flex items-center gap-2">
						{balanceSheet.isBalanced ? (
							<>
								<CheckCircle2 className="h-5 w-5 text-green-600" />
								<span className="text-sm font-medium text-green-600">
									Balance Sheet is balanced
								</span>
							</>
						) : (
							<>
								<AlertCircle className="h-5 w-5 text-red-600" />
								<span className="text-sm font-medium text-red-600">
									Balance Sheet is not balanced. Difference: ₹
									{balanceSheet.difference?.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</>
						)}
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="flex items-center justify-center h-64">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}

				{/* Error State */}
				{error && (
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-2 text-destructive">
								<AlertCircle className="h-5 w-5" />
								<p className="text-sm">
									Failed to load balance sheet. Please try again.
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Balance Sheet Data */}
				{balanceSheet && !isLoading && (
					<Card>
						<CardHeader>
							<div className="text-center space-y-1">
								<CardTitle className="text-2xl font-bold">
									Balance Sheet
								</CardTitle>
								{balanceSheet.asOf && (
									<p className="text-sm text-muted-foreground">
										As of {format(new Date(balanceSheet.asOf), "MMMM dd, yyyy")}
									</p>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Assets Column */}
								<div className="space-y-4">
									<div className="pb-2 border-b-2 border-border">
										<h2 className="text-lg font-semibold uppercase">Assets</h2>
									</div>
									<div className="space-y-1">
										{assetsAccounts.map((account) => (
											<AccountTreeRow
												key={account.accountId}
												account={account}
												level={0}
											/>
										))}
									</div>
									{/* Total Assets */}
									<div className="flex items-center justify-between py-4 border-t-2 border-border font-bold text-lg bg-muted/50">
										<span>Total Assets</span>
										<span>
											{"₹"}
											{balanceSheet.assets.total.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
									</div>
								</div>

								{/* Liabilities & Equity Column */}
								<div className="space-y-4">
									<div className="pb-2 border-b-2 border-border">
										<h2 className="text-lg font-semibold uppercase">
											Liabilities & Equities
										</h2>
									</div>
									<div className="space-y-1">
										{/* Liabilities Section */}
										{liabilitiesAccounts.length > 0 && (
											<>
												<div className="py-2 border-b border-border">
													<h3 className="text-sm font-semibold uppercase tracking-wide">
														Liabilities
													</h3>
												</div>
												{liabilitiesAccounts.map((account) => (
													<AccountTreeRow
														key={account.accountId}
														account={account}
														level={0}
													/>
												))}
												{/* Total Liabilities */}
												<div className="flex items-center justify-between py-3 border-t-2 border-border font-semibold bg-muted/30">
													<span className="text-sm uppercase tracking-wide">
														Total Liabilities
													</span>
													<span className="text-sm">
														{"₹"}
														{balanceSheet.liabilities.total.toLocaleString(
															"en-IN",
															{
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															}
														)}
													</span>
												</div>
											</>
										)}

										{/* Equity Section */}
										{equityAccounts.length > 0 && (
											<>
												<div className="py-2 border-b border-border">
													<h3 className="text-sm font-semibold uppercase tracking-wide">
														Equities
													</h3>
												</div>
												{equityAccounts.map((account) => (
													<AccountTreeRow
														key={account.accountId}
														account={account}
														level={0}
													/>
												))}
												{/* Total Equities */}
												<div className="flex items-center justify-between py-3 border-t-2 border-border font-semibold bg-muted/30">
													<span className="text-sm uppercase tracking-wide">
														Total Equities
													</span>
													<span className="text-sm">
														{"₹"}
														{balanceSheet.equity.total.toLocaleString("en-IN", {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</span>
												</div>
											</>
										)}
									</div>
									{/* Total Liabilities & Equity */}
									<div className="flex items-center justify-between py-4 border-t-2 border-border font-bold text-lg bg-muted/50">
										<span>Total Liabilities & Equities</span>
										<span>
											{"₹"}
											{balanceSheet.totalLiabilitiesAndEquity.toLocaleString(
												"en-IN",
												{
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												}
											)}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
