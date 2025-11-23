"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import {
	Loader2,
	RefreshCw,
	FileText,
	AlertTriangle,
	CheckCircle2,
	KeyRound,
	Lock,
	Info,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashTitle from "@/components/header/dash-title";
import {
	useGSTList,
	useReconcileGST,
	useGST,
	useGSTAuthStatus,
	useRequestOTP,
	useAuthenticateGST,
	GSTAuthStatus,
} from "@/queries/gst";
import { useSession } from "@/queries/auth";
import { toast } from "sonner";

export default function GSTReconcilePage() {
	const searchParams = useSearchParams();
	const gstIdParam = searchParams.get("gstId");
	const { data: sessionData } = useSession();

	const [selectedGstId, setSelectedGstId] = React.useState<string | null>(
		gstIdParam || null
	);
	const [retPeriod, setRetPeriod] = React.useState<string>("");
	const [fy, setFy] = React.useState<string>("");
	const [reconciliationResult, setReconciliationResult] =
		React.useState<any>(null);
	const [otp, setOtp] = React.useState("");
	const [txn, setTxn] = React.useState("");
	const [acknowledgedThirdParty, setAcknowledgedThirdParty] =
		React.useState(false);

	const { data: gstListData } = useGSTList({ page: 1, limit: 100 });
	const { data: selectedGST } = useGST(selectedGstId);
	const { mutate: reconcile, isPending: isReconciling } = useReconcileGST();
	const { mutate: requestOTP, isPending: isRequestingOTP } = useRequestOTP();
	const { mutate: authenticate, isPending: isAuthenticating } =
		useAuthenticateGST();

	// Get first GST record if available
	const gstRecords = gstListData?.data?.docs || [];
	const gstRecord = selectedGstId
		? gstRecords.find((g) => g.id === selectedGstId)
		: gstRecords[0] || null;
	const currentGstId = gstRecord?.id || selectedGstId;

	// Check authentication status
	const { data: authStatusData } = useGSTAuthStatus(currentGstId);
	const authStatus = authStatusData?.data;

	const isAuthenticated =
		authStatus?.authenticated ||
		gstRecord?.authStatus === GSTAuthStatus.AUTHENTICATED;
	const isTokenExpired = authStatus?.tokenExpired || false;
	const needsAuthentication = !gstRecord || !isAuthenticated || isTokenExpired;

	const handleRequestOTP = () => {
		if (!currentGstId) return;
		requestOTP(currentGstId, {
			onSuccess: (response) => {
				setTxn(response.data.txn);
				// Auto-fill sandbox OTP
				setOtp("575757");
				toast.success("OTP sent successfully!");
			},
		});
	};

	const handleAuthenticate = () => {
		if (!currentGstId || !otp || !txn) return;
		authenticate(
			{
				id: currentGstId,
				data: { otp, txn },
			},
			{
				onSuccess: () => {
					setOtp("");
					setTxn("");
					toast.success("GST authenticated successfully!");
				},
			}
		);
	};

	// Generate return period options
	const returnPeriods = React.useMemo(() => {
		const periods: string[] = [];
		const now = new Date();
		for (let i = 0; i < 12; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const year = String(date.getFullYear()).slice(-2);
			periods.push(`${month}${year}`);
		}
		return periods;
	}, []);

	// Generate financial year options
	const financialYears = React.useMemo(() => {
		const years: string[] = [];
		const now = new Date();
		const currentFY =
			now.getMonth() >= 3
				? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`
				: `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
		years.push(currentFY);
		years.push(
			`${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`
		);
		return years;
	}, []);

	const handleReconcile = () => {
		if (!selectedGstId || !retPeriod || !fy) {
			return;
		}

		// For now, pass empty booksData - backend will fetch from database
		// In future, this can be populated from purchase bills/invoices
		const booksData: any[] = [];

		reconcile(
			{
				id: selectedGstId,
				data: {
					retPeriod,
					fy,
					booksData,
					fetch2A: true,
				},
			},
			{
				onSuccess: (response) => {
					setReconciliationResult(response.data.reconciliation);
				},
			}
		);
	};

	const reconciliation = reconciliationResult;

	return (
		<div className="space-y-6 relative">
			{/* Blur overlay when authentication is needed */}
			{needsAuthentication && (
				<div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
					<Dialog open={needsAuthentication} onOpenChange={() => {}}>
						<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2">
									<Lock className="h-5 w-5" />
									GST Authentication Required
								</DialogTitle>
								<DialogDescription>
									Please authenticate your GST credentials and grant third-party
									API access to use GST reconciliation.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								{/* Third-Party API Access Information */}
								<Alert>
									<Info className="h-4 w-4" />
									<AlertDescription className="space-y-2">
										<p className="font-medium">
											Third-Party API Access Required
										</p>
										<p className="text-sm">
											To enable GST reconciliation and analysis, you must grant
											third-party API access in your GST portal. This allows our
											application to securely access your GST data for
											reconciliation purposes.
										</p>
										<div className="mt-3 space-y-2">
											<p className="text-sm font-medium">
												Steps to enable third-party access:
											</p>
											<ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
												<li>Log in to your GST portal (GST.gov.in)</li>
												<li>Navigate to "My Profile" → "Third Party Access"</li>
												<li>Enable "Third Party API Access" for analysis</li>
												<li>Return here to authenticate with OTP</li>
											</ol>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="mt-3"
											onClick={() =>
												window.open("https://www.gst.gov.in/", "_blank")
											}>
											<ExternalLink className="mr-2 h-4 w-4" />
											Open GST Portal
										</Button>
									</AlertDescription>
								</Alert>

								<div className="flex items-start space-x-2 p-3 border rounded-lg bg-muted/50">
									<Checkbox
										id="third-party-ack"
										checked={acknowledgedThirdParty}
										onCheckedChange={(checked) =>
											setAcknowledgedThirdParty(checked === true)
										}
									/>
									<Label
										htmlFor="third-party-ack"
										className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
										I acknowledge that I have enabled third-party API access in
										my GST portal and understand that this allows the
										application to access my GST data for reconciliation and
										analysis purposes.
									</Label>
								</div>
								{!gstRecord ? (
									<div className="text-center py-8">
										<KeyRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
										<p className="text-sm text-muted-foreground">
											No GST credentials found. Please create GST credentials
											first.
										</p>
										<Button
											className="mt-4"
											onClick={() => (window.location.href = "/gst")}>
											Go to GST Settings
										</Button>
									</div>
								) : (
									<>
										<div className="space-y-2">
											<Label>GSTIN</Label>
											<Input value={gstRecord.gstin} disabled />
										</div>
										<div className="space-y-2">
											<Label>Email</Label>
											<Input value={gstRecord.email} disabled />
										</div>
										{!txn ? (
											<Button
												onClick={handleRequestOTP}
												disabled={isRequestingOTP || !acknowledgedThirdParty}
												className="w-full">
												{isRequestingOTP ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Requesting OTP...
													</>
												) : (
													<>
														<KeyRound className="mr-2 h-4 w-4" />
														Request OTP
													</>
												)}
											</Button>
										) : (
											<>
												<div className="space-y-2">
													<Label>OTP</Label>
													<Input
														placeholder="Enter OTP (use 575757 for sandbox)"
														value={otp}
														onChange={(e) => setOtp(e.target.value)}
														maxLength={6}
													/>
												</div>
												<Button
													onClick={handleAuthenticate}
													disabled={isAuthenticating || !otp}
													className="w-full">
													{isAuthenticating ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Authenticating...
														</>
													) : (
														<>
															<CheckCircle2 className="mr-2 h-4 w-4" />
															Authenticate
														</>
													)}
												</Button>
											</>
										)}
										{isTokenExpired && (
											<div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-3">
												<p className="text-sm text-yellow-800 dark:text-yellow-200">
													Your GST authentication token has expired. Please
													re-authenticate.
												</p>
											</div>
										)}
									</>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</div>
			)}

			<div
				className={needsAuthentication ? "pointer-events-none opacity-50" : ""}>
				<DashTitle title="GST Reconciliation" />

				<Card>
					<CardHeader>
						<CardTitle>Reconciliation Parameters</CardTitle>
						<CardDescription>
							Select GST credentials and return period to reconcile
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">GSTIN</label>
								<Select
									value={selectedGstId || ""}
									onValueChange={setSelectedGstId}>
									<SelectTrigger>
										<SelectValue placeholder="Select GSTIN" />
									</SelectTrigger>
									<SelectContent>
										{gstRecords.map((gst) => (
											<SelectItem key={gst.id} value={gst.id}>
												{gst.gstin}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">Return Period</label>
								<Select value={retPeriod} onValueChange={setRetPeriod}>
									<SelectTrigger>
										<SelectValue placeholder="Select Period" />
									</SelectTrigger>
									<SelectContent>
										{returnPeriods.map((period) => (
											<SelectItem key={period} value={period}>
												{period}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">Financial Year</label>
								<Select value={fy} onValueChange={setFy}>
									<SelectTrigger>
										<SelectValue placeholder="Select FY" />
									</SelectTrigger>
									<SelectContent>
										{financialYears.map((year) => (
											<SelectItem key={year} value={year}>
												{year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<Button
							onClick={handleReconcile}
							disabled={isReconciling || !selectedGstId || !retPeriod || !fy}
							className="w-full md:w-auto">
							{isReconciling ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Reconciling...
								</>
							) : (
								<>
									<RefreshCw className="mr-2 h-4 w-4" />
									Run Reconciliation
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{reconciliation && (
					<div className="grid gap-6">
						{/* Reconciliation Summary */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Reconciliation Summary
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">In Books</p>
										<p className="text-2xl font-bold">
											{reconciliation.total_in_books}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">In GSTR-2A</p>
										<p className="text-2xl font-bold">
											{reconciliation.total_in_2a}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Fully Matched
										</p>
										<p className="text-2xl font-bold text-green-600">
											<CheckCircle2 className="inline h-4 w-4 mr-1" />
											{reconciliation.fully_matched}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Partially Matched
										</p>
										<p className="text-2xl font-bold text-yellow-600">
											<AlertTriangle className="inline h-4 w-4 mr-1" />
											{reconciliation.partially_matched}
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
									<div>
										<p className="text-sm text-muted-foreground">
											Missing in GSTR-2A
										</p>
										<p className="text-2xl font-bold text-red-600">
											{reconciliation.missing_in_2a}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Missing in Books
										</p>
										<p className="text-2xl font-bold text-red-600">
											{reconciliation.missing_in_books}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">ITC Lost</p>
										<p className="text-2xl font-bold text-destructive">
											₹
											{reconciliation.itc_lost_due_to_mismatch.toLocaleString(
												"en-IN"
											)}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Suggested Journals */}
						{reconciliation.suggested_journals &&
							reconciliation.suggested_journals.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Suggested Journal Entries</CardTitle>
										<CardDescription>
											Review and post these journal entries to reconcile
											mismatches
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{reconciliation.suggested_journals.map(
												(journal: any, idx: number) => (
													<div key={idx} className="border rounded-lg p-4">
														<div className="flex items-center justify-between mb-2">
															<div>
																<p className="font-medium">
																	{journal.narration}
																</p>
																<p className="text-sm text-muted-foreground">
																	{journal.date}
																</p>
															</div>
															<Badge variant="outline">Suggested</Badge>
														</div>
														<Table>
															<TableHeader>
																<TableRow>
																	<TableHead>Account</TableHead>
																	<TableHead className="text-right">
																		Debit
																	</TableHead>
																	<TableHead className="text-right">
																		Credit
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{journal.entries.map(
																	(entry: any, entryIdx: number) => (
																		<TableRow key={entryIdx}>
																			<TableCell>{entry.account}</TableCell>
																			<TableCell className="text-right">
																				{entry.debit > 0
																					? `₹${entry.debit.toLocaleString(
																							"en-IN"
																					  )}`
																					: "-"}
																			</TableCell>
																			<TableCell className="text-right">
																				{entry.credit > 0
																					? `₹${entry.credit.toLocaleString(
																							"en-IN"
																					  )}`
																					: "-"}
																			</TableCell>
																		</TableRow>
																	)
																)}
															</TableBody>
														</Table>
													</div>
												)
											)}
										</div>
									</CardContent>
								</Card>
							)}
					</div>
				)}
			</div>
		</div>
	);
}
