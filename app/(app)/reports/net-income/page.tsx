"use client";

import React from "react";
import { format, startOfYear, endOfYear, subYears } from "date-fns";
import {
	Loader2,
	TrendingUp,
	DollarSign,
	RefreshCw,
	Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashTitle from "@/components/header/dash-title";
import { useNetIncome } from "@/queries/reports";
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

export default function NetIncomePage() {
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
	} = useNetIncome({
		fromDate: fromDate ? new Date(fromDate).toISOString() : "",
		toDate: toDate ? new Date(toDate).toISOString() : "",
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const report = reportData?.data;

	const handleRefresh = () => {
		refetch();
	};

	const handleYearChange = (year: string) => {
		const selectedYear = parseInt(year);
		const yearStart = startOfYear(new Date(selectedYear, 0, 1));
		const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
		setFromDate(format(yearStart, "yyyy-MM-dd"));
		setToDate(format(yearEnd, "yyyy-MM-dd"));
	};

	return (
		<div className="space-y-6">
			<DashTitle title="Net Income Report" />

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
				<SummaryCard
					title="Total Revenue"
					amount={report?.revenue || 0}
					icon={TrendingUp}
					color="text-green-600"
				/>
				<SummaryCard
					title="Total Expenses"
					amount={report?.expenses || 0}
					icon={DollarSign}
					color="text-red-600"
				/>
				<SummaryCard
					title="Net Income"
					amount={report?.netIncome || 0}
					icon={DollarSign}
					color={
						(report?.netIncome || 0) >= 0 ? "text-green-600" : "text-red-600"
					}
				/>
			</div>

			{/* Filter and Action Bar */}
			<div className="px-6">
				<Card>
					<CardContent>
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
							<div className="flex items-center gap-4 flex-1">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<label className="text-sm font-medium">Year:</label>
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
									Failed to load net income report. Please try again.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Net Income Report */}
			{report && !isLoading && (
				<div className="px-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								Net Income Report
							</CardTitle>
							{report.period && (
								<p className="text-sm text-muted-foreground">
									From {format(new Date(report.period.from), "MMM dd, yyyy")} to{" "}
									{format(new Date(report.period.to), "MMM dd, yyyy")}
								</p>
							)}
						</CardHeader>
						<CardContent>
							<div className="border rounded-lg overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Description</TableHead>
											<TableHead className="text-right">Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow>
											<TableCell className="font-medium">Revenue</TableCell>
											<TableCell className="text-right font-medium text-green-600">
												{"₹"}
												{(report.revenue || 0).toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell className="font-medium">Expenses</TableCell>
											<TableCell className="text-right font-medium text-red-600">
												{"₹"}
												{(report.expenses || 0).toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
										</TableRow>
										<TableRow className="bg-muted/50 border-t-2">
											<TableCell className="font-bold text-lg">
												Net Income
											</TableCell>
											<TableCell
												className={`text-right font-bold text-lg ${
													report.netIncome >= 0
														? "text-green-600"
														: "text-red-600"
												}`}>
												{"₹"}
												{(report.netIncome || 0).toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
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
