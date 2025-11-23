"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Loader2,
	CheckCircle2,
	Clock,
	XCircle,
	Send,
	KeyRound,
	AlertCircle,
	Circle,
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import DashTitle from "@/components/header/dash-title";
import {
	useGSTList,
	useCreateGST,
	useGST,
	useRequestOTP,
	useAuthenticateGST,
	useGSTAuthStatus,
	GSTAuthStatus,
} from "@/queries/gst";
import { cn } from "@/lib/utils";
import { useSession } from "@/queries/auth";

const createFormSchema = z.object({
	gstin: z
		.string()
		.min(15, "GSTIN must be 15 characters")
		.max(15, "GSTIN must be 15 characters")
		.regex(
			/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
			"Invalid GSTIN format"
		),
	email: z.string().email("Invalid email address"),
	stateCd: z.string().length(2, "State code must be 2 digits"),
	ipAddress: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

type Step = "create" | "authenticate" | "complete";

export default function GSTPage() {
	const { data, isLoading, error } = useGSTList({
		page: 1,
		limit: 1,
	});
	const { data: sessionData } = useSession();

	const gstRecords = data?.data?.docs || [];
	const hasGST = gstRecords.length > 0;
	const gstRecord = gstRecords[0];

	// Fetch GST details and auth status if record exists
	const { data: gstData } = useGST(gstRecord?.id || null);
	const { data: authStatusData } = useGSTAuthStatus(gstRecord?.id || null);

	const gst = gstData?.data;
	const authStatus = authStatusData?.data;

	const isAuthenticated =
		authStatus?.authenticated ||
		gst?.authStatus === GSTAuthStatus.AUTHENTICATED;
	const isTokenExpired = authStatus?.tokenExpired || false;

	// Determine current step
	const currentStep: Step = React.useMemo(() => {
		if (!hasGST || !gst) return "create";
		if (!isAuthenticated || isTokenExpired) return "authenticate";
		return "complete";
	}, [hasGST, gst, isAuthenticated, isTokenExpired]);

	// Create form
	const createForm = useForm<CreateFormValues>({
		resolver: zodResolver(createFormSchema),
		defaultValues: {
			gstin: "",
			email: "",
			stateCd: "",
			ipAddress: "",
		},
	});

	const { mutate: createGST, isPending: isCreating } = useCreateGST();
	const { mutate: requestOTP, isPending: isRequestingOTP } = useRequestOTP();
	const { mutate: authenticate, isPending: isAuthenticating } =
		useAuthenticateGST();

	const [otp, setOtp] = React.useState("");
	const [txn, setTxn] = React.useState("");
	const [isDetectingIP, setIsDetectingIP] = React.useState(false);

	// Auto-detect IP address on component mount
	React.useEffect(() => {
		const detectIP = async () => {
			if (currentStep === "create" && !createForm.getValues("ipAddress")) {
				setIsDetectingIP(true);
				try {
					// Try multiple IP detection services for reliability
					const responses = await Promise.allSettled([
						fetch("https://api.ipify.org?format=json"),
						fetch("https://api64.ipify.org?format=json"),
						fetch("https://ipapi.co/json/"),
					]);

					for (const response of responses) {
						if (response.status === "fulfilled" && response.value.ok) {
							const data = await response.value.json();
							const ip = data.ip || data.query;
							if (ip) {
								createForm.setValue("ipAddress", ip);
								break;
							}
						}
					}
				} catch (error) {
					// Silently fail - IP detection is optional
					console.debug("IP detection failed:", error);
				} finally {
					setIsDetectingIP(false);
				}
			}
		};

		detectIP();
	}, [currentStep, createForm]);

	const handleCreateGST = (values: CreateFormValues) => {
		createGST(
			{
				gstin: values.gstin.toUpperCase(),
				email: values.email,
				stateCd: values.stateCd,
				ipAddress: values.ipAddress || undefined,
				organizationId: sessionData?.session?.activeOrganizationId || "",
			},
			{
				onSuccess: () => {
					// Form will automatically move to authenticate step
				},
			}
		);
	};

	const handleRequestOTP = () => {
		if (!gstRecord?.id) return;
		requestOTP(gstRecord.id, {
			onSuccess: (response) => {
				setTxn(response.data.txn);
				// Sandbox OTP is always 575757
				setOtp("575757");
			},
		});
	};

	const handleAuthenticate = () => {
		if (!otp || !txn || !gstRecord?.id) return;
		authenticate(
			{
				id: gstRecord.id,
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Error loading GST record</p>
			</div>
		);
	}

	const steps = [
		{ id: "create", label: "Create Credentials", completed: hasGST },
		{
			id: "authenticate",
			label: "Authenticate",
			completed: isAuthenticated && !isTokenExpired,
		},
		{
			id: "complete",
			label: "Complete",
			completed: isAuthenticated && !isTokenExpired,
		},
	];

	return (
		<div className="space-y-6">
			<DashTitle title="GST Credentials" />

			<div className="max-w-4xl mx-auto space-y-6">
				{/* Step Indicator */}
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							{steps.map((step, index) => (
								<React.Fragment key={step.id}>
									<div className="flex flex-col items-center flex-1">
										<div
											className={cn(
												"flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
												step.completed
													? "bg-green-500 border-green-500 text-white"
													: currentStep === step.id
													? "bg-primary border-primary text-primary-foreground"
													: "bg-muted border-muted-foreground/20 text-muted-foreground"
											)}>
											{step.completed ? (
												<CheckCircle2 className="h-5 w-5" />
											) : (
												<span className="font-semibold">{index + 1}</span>
											)}
										</div>
										<Label className="mt-2 text-sm text-center">
											{step.label}
										</Label>
									</div>
									{index < steps.length - 1 && (
										<div
											className={cn(
												"flex-1 h-0.5 mx-4 transition-colors",
												step.completed ? "bg-green-500" : "bg-muted"
											)}
										/>
									)}
								</React.Fragment>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Step 1: Create GST Credentials */}
				{currentStep === "create" && (
					<Card>
						<CardHeader>
							<CardTitle>Step 1: Create GST Credentials</CardTitle>
							<CardDescription>
								Enter your GST credentials to get started with GST compliance
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...createForm}>
								<form
									onSubmit={createForm.handleSubmit(handleCreateGST)}
									className="space-y-6">
									<FormField
										control={createForm.control}
										name="gstin"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													GSTIN <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="22AAAAA0000A1Z5"
														className="font-mono uppercase"
														maxLength={15}
														onChange={(e) => {
															field.onChange(e.target.value.toUpperCase());
														}}
													/>
												</FormControl>
												<FormDescription>
													15-character GSTIN (e.g., 22AAAAA0000A1Z5)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={createForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Email <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="email"
														placeholder="ashirvad@finager.in"
													/>
												</FormControl>
												<FormDescription>
													Email address registered with GST portal
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={createForm.control}
										name="stateCd"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													State Code <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="22"
														maxLength={2}
														onChange={(e) => {
															field.onChange(e.target.value.replace(/\D/g, ""));
														}}
													/>
												</FormControl>
												<FormDescription>
													2-digit state code (e.g., 22 for Chhattisgarh)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={createForm.control}
										name="ipAddress"
										render={({ field }) => (
											<FormItem>
												<FormLabel>IP Address</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															{...field}
															placeholder={
																isDetectingIP
																	? "Detecting IP address..."
																	: "192.168.1.1"
															}
															disabled={isDetectingIP}
														/>
														{isDetectingIP && (
															<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
														)}
													</div>
												</FormControl>
												<FormDescription>
													IP address is automatically detected. Optional for
													authentication.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="flex justify-end">
										<Button type="submit" disabled={isCreating}>
											{isCreating ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Creating...
												</>
											) : (
												"Create & Continue"
											)}
										</Button>
									</div>
								</form>
							</Form>
						</CardContent>
					</Card>
				)}

				{/* Step 2: Authenticate */}
				{currentStep === "authenticate" && gst && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Step 2: Authenticate GST</CardTitle>
									<CardDescription>
										{isTokenExpired
											? "Your GST token has expired. Please re-authenticate to continue using GST services."
											: "Request OTP and authenticate your GST credentials to access GST reports and reconciliation."}
									</CardDescription>
								</div>
								{getStatusBadge(authStatus?.authStatus || gst.authStatus)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* GST Details */}
							<div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/50 rounded-lg">
								<div>
									<span className="text-muted-foreground">GSTIN:</span>
									<span className="ml-2 font-mono font-medium">
										{gst.gstin}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">Email:</span>
									<span className="ml-2 font-medium">{gst.email}</span>
								</div>
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
							</div>

							{/* OTP Authentication */}
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

				{/* Step 3: Complete - Show Status and Details */}
				{currentStep === "complete" && gst && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>GST Credentials - Authenticated</CardTitle>
									<CardDescription>
										Your GST credentials are authenticated and ready to use
									</CardDescription>
								</div>
								{getStatusBadge(authStatus?.authStatus || gst.authStatus)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Status Indicator */}
							<div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
								<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
								<span className="text-green-700 dark:text-green-300 font-medium">
									Authenticated and ready to use
								</span>
							</div>

							{/* GST Details */}
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">GSTIN:</span>
										<span className="ml-2 font-mono font-medium">
											{gst.gstin}
										</span>
									</div>
									<div>
										<span className="text-muted-foreground">Email:</span>
										<span className="ml-2 font-medium">{gst.email}</span>
									</div>
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
									{authStatus?.tokenExpiry && (
										<div>
											<span className="text-muted-foreground">
												Token Expiry:
											</span>
											<span
												className={cn(
													"ml-2 font-medium",
													authStatus.needsRefresh || authStatus.tokenExpired
														? "text-destructive"
														: ""
												)}>
												{new Date(authStatus.tokenExpiry).toLocaleString()}
												{authStatus.tokenExpired && (
													<span className="ml-2 text-xs">(Expired)</span>
												)}
												{authStatus.needsRefresh &&
													!authStatus.tokenExpired && (
														<span className="ml-2 text-xs">
															(Expiring Soon)
														</span>
													)}
											</span>
										</div>
									)}
									<div>
										<span className="text-muted-foreground">
											Last Reconciled:
										</span>
										<span className="ml-2 font-medium">
											{gst.lastReconciliationDate
												? new Date(
														gst.lastReconciliationDate
												  ).toLocaleDateString()
												: "Never"}
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
