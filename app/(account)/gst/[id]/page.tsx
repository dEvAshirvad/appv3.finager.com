"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import {
	Loader2,
	CheckCircle2,
	Clock,
	XCircle,
	Send,
	KeyRound,
	AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashTitle from "@/components/header/dash-title";
import {
	useGST,
	useRequestOTP,
	useAuthenticateGST,
	useGSTAuthStatus,
	GSTAuthStatus,
} from "@/queries/gst";

export default function GSTDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const resolvedParams = use(params);
	const gstId = resolvedParams.id;

	const { data, isLoading, error } = useGST(gstId);
	const { data: authStatusData, isLoading: isLoadingAuthStatus } =
		useGSTAuthStatus(gstId);
	const { mutate: requestOTP, isPending: isRequestingOTP } = useRequestOTP();
	const { mutate: authenticate, isPending: isAuthenticating } =
		useAuthenticateGST();

	const [otp, setOtp] = React.useState("");
	const [txn, setTxn] = React.useState("");

	const gst = data?.data;
	const authStatus = authStatusData?.data;

	const handleRequestOTP = () => {
		requestOTP(gstId, {
			onSuccess: (response) => {
				setTxn(response.data.txn);
				// Sandbox OTP is always 575757
				setOtp("575757");
			},
		});
	};

	const handleAuthenticate = () => {
		if (!otp || !txn) {
			return;
		}
		authenticate(
			{
				id: gstId,
				data: { otp, txn },
			},
			{
				onSuccess: () => {
					setOtp("");
					setTxn("");
				},
			}
		);
	};

	const getStatusBadge = (status: GSTAuthStatus) => {
		switch (status) {
			case GSTAuthStatus.AUTHENTICATED:
				return (
					<Badge variant="default" className="bg-green-500">
						<CheckCircle2 className="mr-1 h-3 w-3" />
						Authenticated
					</Badge>
				);
			case GSTAuthStatus.PENDING:
				return (
					<Badge variant="secondary">
						<Clock className="mr-1 h-3 w-3" />
						Pending
					</Badge>
				);
			case GSTAuthStatus.EXPIRED:
				return (
					<Badge variant="destructive">
						<XCircle className="mr-1 h-3 w-3" />
						Expired
					</Badge>
				);
			case GSTAuthStatus.FAILED:
				return (
					<Badge variant="destructive">
						<XCircle className="mr-1 h-3 w-3" />
						Failed
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	if (isLoading || isLoadingAuthStatus) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);
	}

	if (error || !gst) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">GST record not found</p>
			</div>
		);
	}

	const isAuthenticated =
		authStatus?.authenticated || gst.authStatus === GSTAuthStatus.AUTHENTICATED;
	const tokenExpiry = authStatus?.tokenExpiry
		? new Date(authStatus.tokenExpiry)
		: gst.authToken?.expiry
		? new Date(gst.authToken.expiry)
		: null;
	const isTokenExpiring = authStatus?.needsRefresh || false;
	const isTokenExpired = authStatus?.tokenExpired || false;

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<DashTitle title="GST Credentials" />
			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="font-mono">{gst.gstin}</CardTitle>
								<CardDescription>{gst.email}</CardDescription>
							</div>
							{getStatusBadge(authStatus?.authStatus || gst.authStatus)}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">State Code:</span>
								<span className="ml-2 font-medium">{gst.stateCd}</span>
							</div>
							<div>
								<span className="text-muted-foreground">IP Address:</span>
								<span className="ml-2 font-medium">
									{gst.ipAddress || "N/A"}
								</span>
							</div>
							{tokenExpiry && (
								<div>
									<span className="text-muted-foreground">Token Expiry:</span>
									<span
										className={`ml-2 font-medium ${
											isTokenExpiring || isTokenExpired
												? "text-destructive"
												: ""
										}`}>
										{tokenExpiry.toLocaleString()}
										{isTokenExpired && (
											<span className="ml-2 text-xs">(Expired)</span>
										)}
										{isTokenExpiring && !isTokenExpired && (
											<span className="ml-2 text-xs">(Expiring Soon)</span>
										)}
									</span>
								</div>
							)}
							<div>
								<span className="text-muted-foreground">Last Reconciled:</span>
								<span className="ml-2 font-medium">
									{gst.lastReconciliationDate
										? new Date(gst.lastReconciliationDate).toLocaleDateString()
										: "Never"}
								</span>
							</div>
						</div>
						{authStatus && (
							<div className="pt-4 border-t">
								<div className="flex items-center gap-2 text-sm">
									{authStatus.authenticated ? (
										<>
											<CheckCircle2 className="h-4 w-4 text-green-500" />
											<span className="text-green-600 font-medium">
												Authenticated and ready to use
											</span>
										</>
									) : (
										<>
											<AlertCircle className="h-4 w-4 text-yellow-500" />
											<span className="text-yellow-600 font-medium">
												Authentication required
											</span>
										</>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{(!isAuthenticated || isTokenExpired) && (
					<Card>
						<CardHeader>
							<CardTitle>Authenticate GST</CardTitle>
							<CardDescription>
								{isTokenExpired
									? "Your GST token has expired. Please re-authenticate to continue using GST services."
									: "Request OTP and authenticate your GST credentials to access GST reports and reconciliation."}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{!txn ? (
								<Button
									onClick={handleRequestOTP}
									disabled={isRequestingOTP}
									className="w-full">
									{isRequestingOTP ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Requesting OTP...
										</>
									) : (
										<>
											<Send className="mr-2 h-4 w-4" />
											Request OTP
										</>
									)}
								</Button>
							) : (
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="otp">OTP</Label>
										<Input
											id="otp"
											value={otp}
											onChange={(e) => setOtp(e.target.value)}
											placeholder="Enter OTP"
											maxLength={6}
										/>
										<p className="text-sm text-muted-foreground">
											OTP sent to {gst.email}. For sandbox, use: 575757
										</p>
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
												<KeyRound className="mr-2 h-4 w-4" />
												Authenticate
											</>
										)}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{isAuthenticated && !isTokenExpired && (
					<div className="flex gap-4">
						<Button
							variant="outline"
							onClick={() => router.push(`/gst/reconcile?gstId=${gstId}`)}>
							Reconcile
						</Button>
						<Button
							variant="outline"
							onClick={() => router.push(`/reports/gst?gstId=${gstId}`)}>
							View Reports
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
