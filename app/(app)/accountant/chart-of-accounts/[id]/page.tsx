"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	ArrowLeft,
	Loader2,
	Edit,
	TrendingUp,
	DollarSign,
	FileText,
	ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import DashTitle from "@/components/header/dash-title";
import {
	useCOA,
	useAccountJournalEntries,
	AccountJournalEntry,
	AccountStatus,
} from "@/queries/chart-of-accounts";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AccountDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	return <AccountDetailsContent accountId={resolvedParams.id} />;
}

function AccountDetailsContent({ accountId }: { accountId: string }) {
	const router = useRouter();
	const { data: accountData, isLoading: isLoadingAccount } = useCOA(accountId);
	const [journalPage, setJournalPage] = React.useState(1);
	const [journalStatus, setJournalStatus] = React.useState<
		"draft" | "posted" | "reversed"
	>("posted");

	const { data: journalData, isLoading: isLoadingJournal } =
		useAccountJournalEntries({
			accountId: accountId,
			status: journalStatus,
			page: journalPage,
			limit: 20,
		});

	// Get descendant account IDs for hierarchical matching (must be before conditional returns)
	const descendantAccountIds = React.useMemo(() => {
		if (!journalData?.data?.descendantAccounts) {
			// Fallback: if no descendantAccounts, just use the current account
			return [accountId];
		}
		return journalData.data.descendantAccounts.map((acc) => acc._id);
	}, [journalData, accountId]);

	// Show info about descendant accounts if available (must be before conditional returns)
	const hasDescendants =
		journalData?.data?.descendantAccounts &&
		journalData.data.descendantAccounts.length > 1;
	const descendantCount = journalData?.data?.descendantAccounts?.length || 0;

	// Calculate stats from journal entries (must be before conditional returns)
	const stats = React.useMemo(() => {
		if (!journalData?.data?.journalEntries) {
			return {
				totalDebits: 0,
				totalCredits: 0,
				netBalance: 0,
				transactionCount: 0,
			};
		}

		let totalDebits = 0;
		let totalCredits = 0;
		let transactionCount = 0;

		journalData.data.journalEntries.forEach((entry) => {
			// Find transaction that matches the account or any of its descendants
			const transaction = entry.transactions.find((t) => {
				// Use accountInfo if available (new API structure)
				if (t.accountInfo) {
					return descendantAccountIds.includes(t.accountInfo._id);
				}
				// Fallback to accountId (old structure)
				const tAccountId =
					typeof t.accountId === "string" ? t.accountId : t.accountId._id;
				return descendantAccountIds.includes(tAccountId);
			});

			if (transaction) {
				transactionCount++;
				if (transaction.type === "debit") {
					totalDebits += transaction.amount;
				} else {
					totalCredits += transaction.amount;
				}
			}
		});

		return {
			totalDebits,
			totalCredits,
			netBalance: totalDebits - totalCredits,
			transactionCount,
		};
	}, [journalData, descendantAccountIds]);

	const account = accountData?.data;

	if (isLoadingAccount) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!account) {
		return (
			<div className="p-6">
				<Button variant="ghost" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<div className="mt-4 text-center">
					<p className="text-destructive">Account not found</p>
				</div>
			</div>
		);
	}

	// Helper to get transaction amount for this account or its descendants
	const getTransactionAmount = (entry: AccountJournalEntry) => {
		// Find transaction that matches the account or any of its descendants
		const transaction = entry.transactions.find((t) => {
			// Use accountInfo if available (new API structure)
			if (t.accountInfo) {
				return descendantAccountIds.includes(t.accountInfo._id);
			}
			// Fallback to accountId (old structure)
			const tAccountId =
				typeof t.accountId === "string" ? t.accountId : t.accountId._id;
			return descendantAccountIds.includes(tAccountId);
		});
		return transaction
			? {
					amount: transaction.amount,
					type: transaction.type,
					accountInfo: transaction.accountInfo,
			  }
			: null;
	};

	// Stats Card Component
	const StatsCard = ({
		title,
		amount,
		icon: Icon,
		color,
		description,
		isCount = false,
	}: {
		title: string;
		amount: number;
		icon: React.ElementType;
		color: string;
		description?: string;
		isCount?: boolean;
	}) => (
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
						{isCount ? (
							amount.toLocaleString("en-IN")
						) : (
							<>
								{"₹"}
								{amount.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</>
						)}
					</p>
					{description && (
						<p className="text-sm text-muted-foreground mt-1">{description}</p>
					)}
				</div>
			</CardHeader>
		</Card>
	);

	return (
		<div className="space-y-6">
			<div className="">
				<DashTitle title={account.name} />
				{hasDescendants && (
					<p className="text-sm text-muted-foreground mt-2">
						Showing transactions for this account and {descendantCount - 1}{" "}
						descendant account
						{descendantCount - 1 !== 1 ? "s" : ""}
					</p>
				)}
			</div>

			{/* Stats Cards */}
			{!isLoadingJournal && journalData?.data?.journalEntries && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
					<StatsCard
						title="Total Debits"
						amount={stats.totalDebits}
						icon={TrendingUp}
						color="text-blue-600"
						description={`${
							journalStatus.charAt(0).toUpperCase() + journalStatus.slice(1)
						} transactions`}
					/>
					<StatsCard
						title="Total Credits"
						amount={stats.totalCredits}
						icon={ArrowDown}
						color="text-red-600"
						description={`${
							journalStatus.charAt(0).toUpperCase() + journalStatus.slice(1)
						} transactions`}
					/>
					<StatsCard
						title="Net Balance"
						amount={stats.netBalance}
						icon={DollarSign}
						color={stats.netBalance >= 0 ? "text-green-600" : "text-red-600"}
						description="Debits - Credits"
					/>
					<StatsCard
						title="Transaction Count"
						amount={stats.transactionCount}
						icon={FileText}
						color="text-purple-600"
						description={`Page ${journalData.data.page} of ${journalData.data.totalPages}`}
						isCount={true}
					/>
				</div>
			)}

			{/* Transactions Section */}
			<div className="space-y-4 px-4 lg:px-6">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">Transactions</h3>
					<Select
						value={journalStatus}
						onValueChange={(value) => {
							setJournalStatus(value as "draft" | "posted" | "reversed");
							setJournalPage(1);
						}}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="posted">Posted</SelectItem>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="reversed">Reversed</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{isLoadingJournal ? (
					<div className="flex items-center justify-center h-64">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : journalData?.data?.journalEntries &&
				  journalData.data.journalEntries.length > 0 ? (
					<>
						<div className="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Journal Entry</TableHead>
										<TableHead className="text-right">Debit</TableHead>
										<TableHead className="text-right">Credit</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{journalData.data.journalEntries.map((entry) => {
										const transaction = getTransactionAmount(entry);
										if (!transaction) return null;

										// Get the account name from accountInfo if available
										const accountName =
											transaction.accountInfo?.name ||
											(typeof transaction.accountInfo === "object"
												? transaction.accountInfo?.name
												: null);

										return (
											<TableRow
												key={entry._id}
												className="cursor-pointer hover:bg-muted/50"
												onClick={() =>
													router.push(
														`/accountant/manual-journal/update/${entry._id}`
													)
												}>
												<TableCell>
													{format(new Date(entry.date), "MMM dd, yyyy")}
												</TableCell>
												<TableCell>
													<div>
														<div className="font-medium">{entry.name}</div>
														{entry.reference && (
															<div className="text-xs text-muted-foreground">
																Ref: {entry.reference}
															</div>
														)}
														{accountName && accountName !== account.name && (
															<div className="text-xs text-muted-foreground mt-1">
																Account: {accountName}
															</div>
														)}
													</div>
												</TableCell>
												<TableCell className="text-right">
													{transaction.type === "debit" ? (
														<span className="text-blue-600 font-medium">
															{"₹"}
															{transaction.amount.toLocaleString("en-IN", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													{transaction.type === "credit" ? (
														<span className="text-red-600 font-medium">
															{"₹"}
															{transaction.amount.toLocaleString("en-IN", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						{journalData.data.totalPages > 1 && (
							<div className="flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									Page {journalData.data.page} of {journalData.data.totalPages}
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setJournalPage((p) => Math.max(1, p - 1))}
										disabled={!journalData.data.prevPage || isLoadingJournal}>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setJournalPage((p) =>
												Math.min(journalData.data.totalPages, p + 1)
											)
										}
										disabled={!journalData.data.nextPage || isLoadingJournal}>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="border rounded-lg p-12 text-center">
						<p className="text-sm text-muted-foreground">
							No {journalStatus} transactions available
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
