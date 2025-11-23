"use client";

import DashTitle from "@/components/header/dash-title";
import React from "react";
import { useRouter } from "next/navigation";
import {
	BarChart,
	FileText,
	TrendingUp,
	Calculator,
	Search,
	ArrowUpDown,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Report {
	title: string;
	url: string;
	icon: React.ElementType;
	description: string;
	category: string;
}

const reports: Report[] = [
	{
		title: "Profit and Loss",
		url: "/reports/profit-and-loss",
		icon: TrendingUp,
		description: "View your revenue, expenses, and net income over a period",
		category: "Business Overview",
	},
	{
		title: "Balance Sheet",
		url: "/reports/balance-sheet",
		icon: BarChart,
		description: "See your assets, liabilities, and equity at a point in time",
		category: "Business Overview",
	},
	{
		title: "Trial Balance",
		url: "/reports/trial-balance",
		icon: Calculator,
		description: "Review all account balances and verify debits equal credits",
		category: "Accounting",
	},
	{
		title: "Net Income",
		url: "/reports/net-income",
		icon: FileText,
		description: "Calculate your net income from revenue and expenses",
		category: "Business Overview",
	},
	{
		title: "Cash Flow",
		url: "/reports/cash-flow",
		icon: ArrowUpDown,
		description:
			"Track cash inflows and outflows by operating, investing, and financing activities",
		category: "Business Overview",
	},
];

export default function ReportsPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = React.useState("");

	const filteredReports = React.useMemo(() => {
		if (!searchQuery.trim()) return reports;
		const query = searchQuery.toLowerCase();
		return reports.filter(
			(report) =>
				report.title.toLowerCase().includes(query) ||
				report.description.toLowerCase().includes(query) ||
				report.category.toLowerCase().includes(query)
		);
	}, [searchQuery]);

	const groupedReports = React.useMemo(() => {
		const groups: Record<string, Report[]> = {};
		filteredReports.forEach((report) => {
			if (!groups[report.category]) {
				groups[report.category] = [];
			}
			groups[report.category].push(report);
		});
		return groups;
	}, [filteredReports]);

	return (
		<div className="space-y-6">
			<div className="px-4 lg:px-6">
				<DashTitle title="Reports Center" />
			</div>

			{/* Search Bar */}
			<div className="px-4 lg:px-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search reports..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Reports Grid */}
			<div className="px-4 lg:px-6 space-y-6">
				{Object.entries(groupedReports).map(([category, categoryReports]) => (
					<div key={category} className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">{category}</h2>
							<span className="text-sm text-muted-foreground">
								{categoryReports.length} report
								{categoryReports.length !== 1 ? "s" : ""}
							</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{categoryReports.map((report) => {
								const Icon = report.icon;
								return (
									<Card
										key={report.title}
										className="cursor-pointer hover:shadow-md transition-shadow"
										onClick={() => router.push(report.url)}>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3">
													<div className="p-2 bg-primary/10 rounded-lg">
														<Icon className="h-5 w-5 text-primary" />
													</div>
													<div className="flex-1">
														<CardTitle className="text-base">
															{report.title}
														</CardTitle>
													</div>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<CardDescription className="text-sm">
												{report.description}
											</CardDescription>
											<div className="mt-4">
												<Button
													variant="ghost"
													size="sm"
													className="w-full"
													onClick={(e) => {
														e.stopPropagation();
														router.push(report.url);
													}}>
													View Report
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</div>
				))}

				{/* No Results */}
				{filteredReports.length === 0 && (
					<div className="text-center py-12">
						<Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<p className="text-lg font-medium text-muted-foreground">
							No reports found
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							Try adjusting your search query
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
