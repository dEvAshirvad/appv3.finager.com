"use client";

import React from "react";
import { format, subYears, startOfYear, endOfYear } from "date-fns";
import {
	Loader2,
	TrendingUp,
	DollarSign,
	FileText,
	RefreshCw,
	Printer,
	Mail,
	Download,
	Calendar,
	ArrowUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashTitle from "@/components/header/dash-title";
import {
	useProfitAndLoss,
	AccountBalance,
	ProfitAndLossReport,
} from "@/queries/reports";
import { useSession } from "@/queries/auth";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

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
						{"₹"}
						{amount.toLocaleString("en-IN", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
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

// Helper to find previous period amount for an account recursively
function getPreviousAmountRecursive(
	account: AccountBalance,
	previousAccounts: AccountBalance[]
): number | undefined {
	// First try to find exact match
	const found = previousAccounts.find(
		(acc) => acc.accountId === account.accountId
	);
	if (found) {
		return calculateAccountTotal(found);
	}

	// If not found and has children, sum children
	if (account.children && account.children.length > 0) {
		const childrenTotal = account.children.reduce((sum, child) => {
			const childAmount = getPreviousAmountRecursive(child, previousAccounts);
			return sum + (childAmount || 0);
		}, 0);
		return childrenTotal > 0 ? childrenTotal : undefined;
	}

	return undefined;
}

// Recursive Account Tree Row Component for P&L Table
function AccountTreeRow({
	account,
	previousAccounts = [],
	level = 0,
}: {
	account: AccountBalance;
	previousAccounts?: AccountBalance[];
	level?: number;
}) {
	const hasChildren = account.children && account.children.length > 0;
	const indentLevel = level * 20; // 20px per level
	const currentAmount = calculateAccountTotal(account);
	const previousAmount = getPreviousAmountRecursive(account, previousAccounts);
	const isParent = hasChildren;
	const isLeaf = !hasChildren;

	const change =
		previousAmount !== undefined && previousAmount !== 0
			? ((currentAmount - previousAmount) / Math.abs(previousAmount)) * 100
			: null;

	return (
		<>
			{/* Account Row */}
			<TableRow>
				<TableCell
					className={`font-medium ${isParent ? "font-semibold" : ""}`}
					style={{ paddingLeft: `${indentLevel + 16}px` }}>
					<div className="flex items-center gap-2">
						{isLeaf && (
							<span className="text-sm font-medium text-muted-foreground">
								{account.accountCode}
							</span>
						)}
						<span>{account.accountName}</span>
					</div>
				</TableCell>
				<TableCell className={`text-right ${isParent ? "font-semibold" : ""}`}>
					{"₹"}
					{currentAmount.toLocaleString("en-IN", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}
				</TableCell>
				<TableCell className={`text-right ${isParent ? "font-semibold" : ""}`}>
					{previousAmount !== undefined ? (
						<>
							{"₹"}
							{previousAmount.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</>
					) : (
						<span className="text-muted-foreground">—</span>
					)}
				</TableCell>
				<TableCell className={`text-right ${isParent ? "font-semibold" : ""}`}>
					{change !== null ? (
						<div className="flex items-center justify-end gap-1">
							<ArrowUp className="h-3 w-3 text-green-600" />
							<span className="text-sm text-green-600">
								{Math.abs(change).toFixed(1)}%
							</span>
						</div>
					) : (
						<span className="text-muted-foreground">—</span>
					)}
				</TableCell>
			</TableRow>
			{/* Render children recursively */}
			{hasChildren &&
				account.children?.map((child) => (
					<AccountTreeRow
						key={child.accountId}
						account={child}
						previousAccounts={previousAccounts}
						level={level + 1}
					/>
				))}
		</>
	);
}

// Section Total Row
function SectionTotalRow({
	label,
	currentAmount,
	previousAmount,
}: {
	label: string;
	currentAmount: number;
	previousAmount?: number;
}) {
	const change =
		previousAmount !== undefined && previousAmount !== 0
			? ((currentAmount - previousAmount) / Math.abs(previousAmount)) * 100
			: null;

	return (
		<TableRow className="bg-muted/50 font-semibold">
			<TableCell className="font-semibold uppercase tracking-wide">
				{label}
			</TableCell>
			<TableCell className="text-right font-semibold">
				{"₹"}
				{currentAmount.toLocaleString("en-IN", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}
			</TableCell>
			<TableCell className="text-right font-semibold">
				{previousAmount !== undefined ? (
					<>
						{"₹"}
						{previousAmount.toLocaleString("en-IN", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
			<TableCell className="text-right font-semibold">
				{change !== null ? (
					<div className="flex items-center justify-end gap-1">
						<ArrowUp className="h-3 w-3 text-green-600" />
						<span className="text-sm text-green-600">
							{Math.abs(change).toFixed(1)}%
						</span>
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
		</TableRow>
	);
}

export default function ProfitAndLossPage() {
	const { data: sessionData } = useSession();
	const currentYear = new Date().getFullYear();
	const [fromDate, setFromDate] = React.useState<string>(
		format(startOfYear(new Date()), "yyyy-MM-dd")
	);
	const [toDate, setToDate] = React.useState<string>(
		format(endOfYear(new Date()), "yyyy-MM-dd")
	);
	const [previousFromDate, setPreviousFromDate] = React.useState<string>(
		format(startOfYear(subYears(new Date(), 1)), "yyyy-MM-dd")
	);
	const [previousToDate, setPreviousToDate] = React.useState<string>(
		format(endOfYear(subYears(new Date(), 1)), "yyyy-MM-dd")
	);

	// Current period query
	const {
		data: currentData,
		isLoading: isLoadingCurrent,
		error: currentError,
		refetch: refetchCurrent,
	} = useProfitAndLoss({
		fromDate: fromDate ? new Date(fromDate).toISOString() : "",
		toDate: toDate ? new Date(toDate).toISOString() : "",
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	// Previous period query
	const { data: previousData, isLoading: isLoadingPrevious } = useProfitAndLoss(
		{
			fromDate: previousFromDate
				? new Date(previousFromDate).toISOString()
				: "",
			toDate: previousToDate ? new Date(previousToDate).toISOString() : "",
			organizationId: sessionData?.session?.activeOrganizationId,
		}
	);

	const currentReport = currentData?.data;
	const previousReport = previousData?.data;

	const isLoading = isLoadingCurrent || isLoadingPrevious;

	// Calculate summary metrics
	const totalRevenue = currentReport?.revenue.total || 0;
	const totalExpenses = currentReport?.expenses.total || 0;
	const grossProfit =
		currentReport?.grossProfit ?? totalRevenue - totalExpenses;
	const operatingExpenses = currentReport?.operatingExpenses || 0;
	const operatingIncome =
		currentReport?.operatingIncome ?? grossProfit - operatingExpenses;
	const netIncome = currentReport?.netIncome || 0;

	// Previous period metrics
	const previousTotalRevenue = previousReport?.revenue.total || 0;
	const previousTotalExpenses = previousReport?.expenses.total || 0;
	const previousGrossProfit =
		previousReport?.grossProfit ?? previousTotalRevenue - previousTotalExpenses;
	const previousOperatingExpenses = previousReport?.operatingExpenses || 0;
	const previousOperatingIncome =
		previousReport?.operatingIncome ??
		previousGrossProfit - previousOperatingExpenses;
	const previousNetIncome = previousReport?.netIncome || 0;

	// Group revenue accounts (income accounts typically start with 4)
	const revenueAccounts = React.useMemo(() => {
		if (!currentReport?.revenue.accounts) return [];
		return currentReport.revenue.accounts;
	}, [currentReport]);

	// Group expense accounts (expense accounts typically start with 5)
	const expenseAccounts = React.useMemo(() => {
		if (!currentReport?.expenses.accounts) return [];
		return currentReport.expenses.accounts;
	}, [currentReport]);

	// Get all previous accounts for recursive lookup
	const previousRevenueAccounts = previousReport?.revenue.accounts || [];
	const previousExpenseAccounts = previousReport?.expenses.accounts || [];
	const allPreviousAccounts = [
		...previousRevenueAccounts,
		...previousExpenseAccounts,
	];

	const handleRefresh = () => {
		refetchCurrent();
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

	const handleYearChange = (year: string) => {
		const selectedYear = parseInt(year);
		const yearStart = startOfYear(new Date(selectedYear, 0, 1));
		const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
		setFromDate(format(yearStart, "yyyy-MM-dd"));
		setToDate(format(yearEnd, "yyyy-MM-dd"));

		// Set previous year
		const prevYearStart = startOfYear(new Date(selectedYear - 1, 0, 1));
		const prevYearEnd = endOfYear(new Date(selectedYear - 1, 0, 1));
		setPreviousFromDate(format(prevYearStart, "yyyy-MM-dd"));
		setPreviousToDate(format(prevYearEnd, "yyyy-MM-dd"));
	};

	return (
		<div className="space-y-6">
			<DashTitle title="Profit & Loss Statement" />

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6">
				<SummaryCard
					title="Total Revenue"
					amount={totalRevenue}
					icon={TrendingUp}
					color="text-green-600"
				/>
				<SummaryCard
					title="Gross Profit"
					amount={grossProfit}
					icon={DollarSign}
					color="text-blue-600"
				/>
				<SummaryCard
					title="Operating Income"
					amount={operatingIncome}
					icon={FileText}
					color={operatingIncome >= 0 ? "text-green-600" : "text-red-600"}
				/>
				<SummaryCard
					title="Net Income"
					amount={netIncome}
					icon={TrendingUp}
					color={netIncome >= 0 ? "text-green-600" : "text-red-600"}
				/>
			</div>

			{/* Filter and Action Bar */}
			<div className="px-6">
				<Card>
					<CardContent className="">
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
							<div className="flex items-center gap-4 flex-1">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<label className="text-sm font-medium">Current Year:</label>
								</div>
								<Select
									value={currentYear.toString()}
									onValueChange={handleYearChange}>
									<SelectTrigger className="w-40">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Array.from({ length: 5 }, (_, i) => currentYear - i).map(
											(year) => (
												<SelectItem key={year} value={year.toString()}>
													{year}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>
								<div className="flex items-center gap-2">
									<label className="text-sm font-medium">Previous Year:</label>
									<Select value={(currentYear - 1).toString()} disabled>
										<SelectTrigger className="w-40">
											<SelectValue />
										</SelectTrigger>
									</Select>
								</div>
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
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center h-64 px-6">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			)}

			{/* Error State */}
			{currentError && (
				<div className="px-6">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-2 text-destructive">
								<Loader2 className="h-5 w-5" />
								<p className="text-sm">
									Failed to load profit and loss statement. Please try again.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Profit & Loss Statement */}
			{currentReport && !isLoading && (
				<div className="px-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								Profit & Loss Statement
							</CardTitle>
							{currentReport.period && (
								<p className="text-sm text-muted-foreground">
									For the year ended{" "}
									{format(new Date(currentReport.period.to), "MMMM dd, yyyy")}
								</p>
							)}
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Description</TableHead>
											<TableHead className="text-right">
												Current Period
											</TableHead>
											<TableHead className="text-right">
												Previous Period
											</TableHead>
											<TableHead className="text-right">Change</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{/* REVENUE Section */}
										{revenueAccounts.length > 0 && (
											<>
												<TableRow>
													<TableCell
														colSpan={4}
														className="font-semibold text-sm uppercase tracking-wide bg-muted/50">
														REVENUE
													</TableCell>
												</TableRow>
												{revenueAccounts.map((account) => (
													<AccountTreeRow
														key={account.accountId}
														account={account}
														previousAccounts={previousRevenueAccounts}
													/>
												))}
												<SectionTotalRow
													label="Total Revenue"
													currentAmount={totalRevenue}
													previousAmount={previousTotalRevenue}
												/>
											</>
										)}

										{/* COST OF GOODS SOLD Section */}
										{expenseAccounts.some(
											(acc) =>
												acc.accountCode.startsWith("6") &&
												parseInt(acc.accountCode) < 7000
										) && (
											<>
												<TableRow>
													<TableCell
														colSpan={4}
														className="font-semibold text-sm uppercase tracking-wide bg-muted/50">
														COST OF GOODS SOLD
													</TableCell>
												</TableRow>
												{expenseAccounts
													.filter(
														(acc) =>
															acc.accountCode.startsWith("6") &&
															parseInt(acc.accountCode) < 7000
													)
													.map((account) => (
														<AccountTreeRow
															key={account.accountId}
															account={account}
															previousAccounts={previousExpenseAccounts}
														/>
													))}
												<SectionTotalRow
													label="Total Cost of Goods Sold"
													currentAmount={expenseAccounts
														.filter(
															(acc) =>
																acc.accountCode.startsWith("6") &&
																parseInt(acc.accountCode) < 7000
														)
														.reduce(
															(sum, acc) => sum + calculateAccountTotal(acc),
															0
														)}
													previousAmount={previousReport?.expenses.accounts
														.filter(
															(acc) =>
																acc.accountCode.startsWith("6") &&
																parseInt(acc.accountCode) < 7000
														)
														.reduce(
															(sum, acc) => sum + calculateAccountTotal(acc),
															0
														)}
												/>
											</>
										)}

										{/* Gross Profit */}
										<TableRow className="bg-muted/30 font-semibold">
											<TableCell className="font-semibold">
												Gross Profit
											</TableCell>
											<TableCell className="text-right font-semibold">
												{"₹"}
												{grossProfit.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right font-semibold">
												{"₹"}
												{previousGrossProfit.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												{previousGrossProfit !== 0 ? (
													<div className="flex items-center justify-end gap-1">
														<ArrowUp className="h-3 w-3 text-green-600" />
														<span className="text-sm text-green-600">
															{Math.abs(
																((grossProfit - previousGrossProfit) /
																	Math.abs(previousGrossProfit)) *
																	100
															).toFixed(1)}
															%
														</span>
													</div>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
										</TableRow>

										{/* OPERATING EXPENSES Section */}
										{expenseAccounts.some(
											(acc) =>
												acc.accountCode.startsWith("7") &&
												parseInt(acc.accountCode) >= 7000
										) && (
											<>
												<TableRow>
													<TableCell
														colSpan={4}
														className="font-semibold text-sm uppercase tracking-wide bg-muted/50">
														OPERATING EXPENSES
													</TableCell>
												</TableRow>
												{expenseAccounts
													.filter(
														(acc) =>
															acc.accountCode.startsWith("7") &&
															parseInt(acc.accountCode) >= 7000
													)
													.map((account) => (
														<AccountTreeRow
															key={account.accountId}
															account={account}
															previousAccounts={previousExpenseAccounts}
														/>
													))}
												<SectionTotalRow
													label="Total Operating Expenses"
													currentAmount={operatingExpenses}
													previousAmount={previousOperatingExpenses}
												/>
											</>
										)}

										{/* Operating Income */}
										<TableRow className="bg-muted/30 font-semibold">
											<TableCell className="font-semibold">
												Operating Income
											</TableCell>
											<TableCell
												className={`text-right font-semibold ${
													operatingIncome >= 0
														? "text-green-600"
														: "text-red-600"
												}`}>
												{"₹"}
												{operatingIncome.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell
												className={`text-right font-semibold ${
													previousOperatingIncome >= 0
														? "text-green-600"
														: "text-red-600"
												}`}>
												{"₹"}
												{previousOperatingIncome.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												{previousOperatingIncome !== 0 ? (
													<div className="flex items-center justify-end gap-1">
														<ArrowUp className="h-3 w-3 text-green-600" />
														<span className="text-sm text-green-600">
															{Math.abs(
																((operatingIncome - previousOperatingIncome) /
																	Math.abs(previousOperatingIncome)) *
																	100
															).toFixed(1)}
															%
														</span>
													</div>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
										</TableRow>

										{/* OTHER INCOME & EXPENSES Section */}
										<TableRow>
											<TableCell
												colSpan={4}
												className="font-semibold text-sm uppercase tracking-wide bg-muted/50">
												OTHER INCOME & EXPENSES
											</TableCell>
										</TableRow>
										{/* This section would need additional account categorization */}
										{/* For now, we'll show a placeholder or additional accounts */}

										{/* Net Income */}
										<TableRow className="bg-muted font-bold text-lg">
											<TableCell className="font-bold">Net Income</TableCell>
											<TableCell
												className={`text-right font-bold ${
													netIncome >= 0 ? "text-green-600" : "text-red-600"
												}`}>
												{"₹"}
												{netIncome.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell
												className={`text-right font-bold ${
													previousNetIncome >= 0
														? "text-green-600"
														: "text-red-600"
												}`}>
												{"₹"}
												{previousNetIncome.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												{previousNetIncome !== 0 ? (
													<div className="flex items-center justify-end gap-1">
														<ArrowUp className="h-3 w-3 text-green-600" />
														<span className="text-sm text-green-600">
															{Math.abs(
																((netIncome - previousNetIncome) /
																	Math.abs(previousNetIncome)) *
																	100
															).toFixed(1)}
															%
														</span>
													</div>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
