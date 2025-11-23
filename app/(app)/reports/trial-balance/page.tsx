"use client";

import React from "react";
import { format } from "date-fns";
import {
	Loader2,
	RefreshCw,
	Calendar,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashTitle from "@/components/header/dash-title";
import { useTrialBalance, TrialBalanceAccount } from "@/queries/reports";
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
import { Input } from "@/components/ui/input";

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

export default function TrialBalancePage() {
	const { data: sessionData } = useSession();
	const [asOfDate, setAsOfDate] = React.useState<string>(
		format(new Date(), "yyyy-MM-dd")
	);

	const {
		data: reportData,
		isLoading,
		error,
		refetch,
	} = useTrialBalance({
		asOfDate: asOfDate ? new Date(asOfDate).toISOString() : undefined,
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const report = reportData?.data;

	const handleRefresh = () => {
		refetch();
	};

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setAsOfDate(e.target.value);
	};

	// Group accounts by type for better organization
	const groupedAccounts = React.useMemo(() => {
		if (!report?.accounts) return {};
		const groups: Record<string, TrialBalanceAccount[]> = {};
		report.accounts.forEach((account) => {
			if (!groups[account.accountType]) {
				groups[account.accountType] = [];
			}
			groups[account.accountType].push(account);
		});
		return groups;
	}, [report?.accounts]);

	const accountTypeLabels: Record<string, string> = {
		asset: "Assets",
		liability: "Liabilities",
		equity: "Equity",
		income: "Income",
		expense: "Expenses",
	};

	return (
		<div className="space-y-6">
			<DashTitle title="Trial Balance" />

			{/* Summary Cards */}
			{report && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
					<SummaryCard
						title="Total Debits"
						amount={report.totalDebits}
						icon={Loader2}
						color="text-blue-600"
					/>
					<SummaryCard
						title="Total Credits"
						amount={report.totalCredits}
						icon={Loader2}
						color="text-red-600"
					/>
					<SummaryCard
						title="Difference"
						amount={report.totalDebits - report.totalCredits}
						icon={report.isBalanced ? CheckCircle2 : AlertCircle}
						color={report.isBalanced ? "text-green-600" : "text-red-600"}
					/>
				</div>
			)}

			{/* Filter and Action Bar */}
			<div className="px-6">
				<Card>
					<CardContent>
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
							<div className="flex items-center gap-4 flex-1">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<label className="text-sm font-medium">As of Date:</label>
								</div>
								<Input
									type="date"
									value={asOfDate}
									onChange={handleDateChange}
									className="w-40"
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
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Balance Status */}
			{report && (
				<div className="px-6">
					<Card>
						<CardContent>
							<div className="flex items-center gap-2">
								{report.isBalanced ? (
									<>
										<CheckCircle2 className="h-5 w-5 text-green-600" />
										<p className="text-sm text-green-600 font-medium">
											Trial Balance is balanced
										</p>
									</>
								) : (
									<>
										<AlertCircle className="h-5 w-5 text-red-600" />
										<p className="text-sm text-red-600 font-medium">
											Trial Balance is not balanced. Difference: {"₹"}
											{Math.abs(
												report.totalDebits - report.totalCredits
											).toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</p>
									</>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center h-64 px-6">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="px-6">
					<Card>
						<CardContent>
							<div className="flex items-center gap-2 text-destructive">
								<Loader2 className="h-5 w-5" />
								<p className="text-sm">
									Failed to load trial balance. Please try again.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Trial Balance Report */}
			{report && !isLoading && (
				<div className="px-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								Trial Balance
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								As of {format(new Date(report.asOf), "MMMM dd, yyyy")}
							</p>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Account Code</TableHead>
											<TableHead>Account Name</TableHead>
											<TableHead>Account Type</TableHead>
											<TableHead className="text-right">Debit</TableHead>
											<TableHead className="text-right">Credit</TableHead>
											<TableHead className="text-right">Balance</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{Object.entries(groupedAccounts).map(([type, accounts]) => (
											<React.Fragment key={type}>
												<TableRow className="bg-muted/50">
													<TableCell
														colSpan={6}
														className="font-semibold uppercase tracking-wide">
														{accountTypeLabels[type] || type}
													</TableCell>
												</TableRow>
												{accounts.map((account) => {
													const balance =
														account.debitBalance - account.creditBalance;
													return (
														<TableRow key={account.accountId}>
															<TableCell className="font-mono text-sm">
																{account.accountCode}
															</TableCell>
															<TableCell className="font-medium">
																{account.accountName}
															</TableCell>
															<TableCell>
																<Badge variant="outline" className="capitalize">
																	{account.accountType}
																</Badge>
															</TableCell>
															<TableCell className="text-right">
																{account.debitBalance > 0 ? (
																	<span className="text-blue-600 font-medium">
																		{"₹"}
																		{account.debitBalance.toLocaleString(
																			"en-IN",
																			{
																				minimumFractionDigits: 2,
																				maximumFractionDigits: 2,
																			}
																		)}
																	</span>
																) : (
																	<span className="text-muted-foreground">
																		—
																	</span>
																)}
															</TableCell>
															<TableCell className="text-right">
																{account.creditBalance > 0 ? (
																	<span className="text-red-600 font-medium">
																		{"₹"}
																		{account.creditBalance.toLocaleString(
																			"en-IN",
																			{
																				minimumFractionDigits: 2,
																				maximumFractionDigits: 2,
																			}
																		)}
																	</span>
																) : (
																	<span className="text-muted-foreground">
																		—
																	</span>
																)}
															</TableCell>
															<TableCell className="text-right">
																<span
																	className={`font-medium ${
																		balance >= 0
																			? "text-blue-600"
																			: "text-red-600"
																	}`}>
																	{balance >= 0 ? "" : "-"}
																	{"₹"}
																	{Math.abs(balance).toLocaleString("en-IN", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
															</TableCell>
														</TableRow>
													);
												})}
											</React.Fragment>
										))}
										<TableRow className="bg-muted font-bold">
											<TableCell colSpan={3} className="font-bold">
												Total
											</TableCell>
											<TableCell className="text-right font-bold">
												{"₹"}
												{report.totalDebits.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right font-bold">
												{"₹"}
												{report.totalCredits.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right font-bold">
												{(() => {
													const difference =
														report.totalDebits - report.totalCredits;
													return (
														<span
															className={
																report.isBalanced
																	? "text-green-600"
																	: "text-red-600"
															}>
															{difference >= 0 ? "" : "-"}
															{"₹"}
															{Math.abs(difference).toLocaleString("en-IN", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</span>
													);
												})()}
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
