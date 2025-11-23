"use client";

import React from "react";
import { format, startOfYear, endOfYear } from "date-fns";
import {
	Loader2,
	RefreshCw,
	Calendar,
	ArrowUp,
	ArrowDown,
	TrendingUp,
	DollarSign,
	Building2,
	Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashTitle from "@/components/header/dash-title";
import {
	useCashFlow,
	CashFlowItem,
	CashFlowReport,
} from "@/queries/reports";
import { useSession } from "@/queries/auth";
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

// Activity Section Component
function ActivitySection({
	title,
	items,
	total,
	icon: Icon,
}: {
	title: string;
	items: CashFlowItem[];
	total: number;
	icon: React.ElementType;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Icon className="h-5 w-5 text-muted-foreground" />
				<h3 className="text-lg font-semibold">{title}</h3>
				<Badge
					variant={total >= 0 ? "default" : "destructive"}
					className="ml-auto">
					{total >= 0 ? "+" : ""}
					{"₹"}
					{Math.abs(total).toLocaleString("en-IN", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}
				</Badge>
			</div>
			{items.length > 0 ? (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Account</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Reference</TableHead>
								<TableHead className="text-right">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item, index) => (
								<TableRow key={`${item.accountId}-${item.date}-${index}`}>
									<TableCell className="font-mono text-sm">
										{format(new Date(item.date), "dd MMM yyyy")}
									</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">{item.accountName}</span>
											<span className="text-xs text-muted-foreground font-mono">
												{item.accountCode}
											</span>
										</div>
									</TableCell>
									<TableCell className="max-w-md">
										{item.description || (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										{item.reference ? (
											<span className="font-mono text-sm">{item.reference}</span>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell
										className={`text-right font-medium ${
											item.amount >= 0
												? "text-green-600"
												: "text-red-600"
										}`}>
										<div className="flex items-center justify-end gap-1">
											{item.amount >= 0 ? (
												<ArrowUp className="h-4 w-4" />
											) : (
												<ArrowDown className="h-4 w-4" />
											)}
											<span>
												{item.amount >= 0 ? "+" : ""}
												{"₹"}
												{Math.abs(item.amount).toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</span>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<div className="rounded-lg border p-8 text-center text-muted-foreground">
					No {title.toLowerCase()} transactions found
				</div>
			)}
		</div>
	);
}

export default function CashFlowPage() {
	const { data: sessionData } = useSession();
	const currentYear = new Date().getFullYear();
	const [fromDate, setFromDate] = React.useState<string>(
		format(startOfYear(new Date()), "yyyy-MM-dd")
	);
	const [toDate, setToDate] = React.useState<string>(
		format(endOfYear(new Date()), "yyyy-MM-dd")
	);

	const {
		data: reportData,
		isLoading,
		error,
		refetch,
	} = useCashFlow({
		fromDate: fromDate ? new Date(fromDate).toISOString() : "",
		toDate: toDate ? new Date(toDate).toISOString() : "",
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const report = reportData?.data;

	const handleRefresh = () => {
		refetch();
	};

	const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFromDate(e.target.value);
	};

	const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setToDate(e.target.value);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Error loading cash flow report</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Cash Flow Statement" />

			{/* Summary Cards */}
			{report && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6">
					<SummaryCard
						title="Opening Cash Balance"
						amount={report.openingCashBalance}
						icon={DollarSign}
						color="text-blue-600"
					/>
					<SummaryCard
						title="Net Cash Flow"
						amount={report.netCashFlow}
						icon={TrendingUp}
						color={
							report.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
						}
					/>
					<SummaryCard
						title="Closing Cash Balance"
						amount={report.closingCashBalance}
						icon={DollarSign}
						color="text-blue-600"
					/>
					<Card className="rounded-md">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Period
								</CardTitle>
								<Calendar className="h-5 w-5 text-muted-foreground" />
							</div>
							<div className="mt-2">
								<p className="text-sm font-medium">
									{format(new Date(report.period.from), "dd MMM yyyy")} -{" "}
									{format(new Date(report.period.to), "dd MMM yyyy")}
								</p>
							</div>
						</CardHeader>
					</Card>
				</div>
			)}

			{/* Filter and Action Bar */}
			<div className="px-6">
				<Card>
					<CardContent>
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
							<div className="flex items-center gap-4 flex-1">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">Period</span>
								</div>
								<Input
									type="date"
									value={fromDate}
									onChange={handleFromDateChange}
									className="w-40"
								/>
								<span className="text-muted-foreground">to</span>
								<Input
									type="date"
									value={toDate}
									onChange={handleToDateChange}
									className="w-40"
								/>
								{report && (
									<span className="text-sm text-muted-foreground">
										{format(new Date(report.period.from), "dd MMM yyyy")} -{" "}
										{format(new Date(report.period.to), "dd MMM yyyy")}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleRefresh}
									disabled={isLoading}>
									<RefreshCw
										className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
									/>
									Refresh
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Cash Flow Report Content */}
			{report && (
				<div className="px-6 space-y-8">
					{/* Operating Activities */}
					<ActivitySection
						title="Operating Activities"
						items={report.operatingActivities.items}
						total={report.operatingActivities.total}
						icon={TrendingUp}
					/>

					{/* Investing Activities */}
					<ActivitySection
						title="Investing Activities"
						items={report.investingActivities.items}
						total={report.investingActivities.total}
						icon={Building2}
					/>

					{/* Financing Activities */}
					<ActivitySection
						title="Financing Activities"
						items={report.financingActivities.items}
						total={report.financingActivities.total}
						icon={Users}
					/>

					{/* Summary Section */}
					<Card>
						<CardHeader>
							<CardTitle>Cash Flow Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between py-2 border-b">
									<span className="text-muted-foreground">
										Opening Cash Balance
									</span>
									<span className="font-medium">
										{"₹"}
										{report.openingCashBalance.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
								<div className="flex items-center justify-between py-2 border-b">
									<span className="text-muted-foreground">
										Operating Activities
									</span>
									<span
										className={`font-medium ${
											report.operatingActivities.total >= 0
												? "text-green-600"
												: "text-red-600"
										}`}>
										{report.operatingActivities.total >= 0 ? "+" : ""}
										{"₹"}
										{Math.abs(report.operatingActivities.total).toLocaleString(
											"en-IN",
											{
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											}
										)}
									</span>
								</div>
								<div className="flex items-center justify-between py-2 border-b">
									<span className="text-muted-foreground">
										Investing Activities
									</span>
									<span
										className={`font-medium ${
											report.investingActivities.total >= 0
												? "text-green-600"
												: "text-red-600"
										}`}>
										{report.investingActivities.total >= 0 ? "+" : ""}
										{"₹"}
										{Math.abs(report.investingActivities.total).toLocaleString(
											"en-IN",
											{
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											}
										)}
									</span>
								</div>
								<div className="flex items-center justify-between py-2 border-b">
									<span className="text-muted-foreground">
										Financing Activities
									</span>
									<span
										className={`font-medium ${
											report.financingActivities.total >= 0
												? "text-green-600"
												: "text-red-600"
										}`}>
										{report.financingActivities.total >= 0 ? "+" : ""}
										{"₹"}
										{Math.abs(report.financingActivities.total).toLocaleString(
											"en-IN",
											{
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											}
										)}
									</span>
								</div>
								<div className="flex items-center justify-between py-2 border-b-2 border-primary">
									<span className="font-semibold">Net Cash Flow</span>
									<span
										className={`font-bold text-lg ${
											report.netCashFlow >= 0
												? "text-green-600"
												: "text-red-600"
										}`}>
										{report.netCashFlow >= 0 ? "+" : ""}
										{"₹"}
										{Math.abs(report.netCashFlow).toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
								<div className="flex items-center justify-between py-2">
									<span className="font-semibold">Closing Cash Balance</span>
									<span className="font-bold text-lg text-blue-600">
										{"₹"}
										{report.closingCashBalance.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{!report && !isLoading && (
				<div className="px-6">
					<Card>
						<CardContent className="py-12 text-center text-muted-foreground">
							No cash flow data available for the selected period
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}

