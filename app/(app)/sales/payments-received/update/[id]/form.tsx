"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Loader2, Plus, Trash2, Search, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	useUpdatePayment,
	usePayment,
	PaymentMethod,
	PaymentStatus,
} from "@/queries/payments";
import { useContactList, ContactType, ContactStatus } from "@/queries/contacts";
import { useInvoiceList, InvoiceStatus } from "@/queries/invoices";
import { useCOAList, AccountType } from "@/queries/chart-of-accounts";
import { useSession } from "@/queries/auth";
import { useDebounce } from "@/hooks/use-debounce";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import DashTitle from "@/components/header/dash-title";
import { Alert, AlertDescription } from "@/components/ui/alert";

const invoiceAllocationSchema = z.object({
	invoiceId: z.string().min(1, "Invoice is required"),
	allocatedAmount: z.number().min(0.01, "Amount must be greater than 0"),
});

const formSchema = z
	.object({
		contactId: z.string().min(1, "Customer is required"),
		date: z.string().min(1, "Date is required"),
		amount: z.number().min(0.01, "Amount must be greater than 0"),
		paymentMethod: z.nativeEnum(PaymentMethod),
		reference: z.string().optional(),
		bankAccountId: z.string().optional(),
		notes: z.string().optional(),
		invoiceAllocations: z.array(invoiceAllocationSchema).optional(),
	})
	.refine(
		(data) => {
			if (
				[
					PaymentMethod.BANK_TRANSFER,
					PaymentMethod.UPI,
					PaymentMethod.CARD,
					PaymentMethod.CHEQUE,
				].includes(data.paymentMethod)
			) {
				return !!data.bankAccountId;
			}
			return true;
		},
		{
			message: "Bank account is required for this payment method",
			path: ["bankAccountId"],
		}
	)
	.refine(
		(data) => {
			if (data.invoiceAllocations && data.invoiceAllocations.length > 0) {
				const totalAllocated = data.invoiceAllocations.reduce(
					(sum, alloc) => sum + alloc.allocatedAmount,
					0
				);
				return totalAllocated <= data.amount;
			}
			return true;
		},
		{
			message: "Total allocated amount cannot exceed payment amount",
			path: ["invoiceAllocations"],
		}
	);

type FormValues = z.infer<typeof formSchema>;

function UpdatePaymentForm({
	paymentId,
	className,
	...props
}: {
	paymentId: string;
} & React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: updatePayment, isPending } = useUpdatePayment();
	const { data: paymentData, isLoading: isLoadingPayment } =
		usePayment(paymentId);
	const { data: sessionData } = useSession();
	const [customerSearch, setCustomerSearch] = React.useState("");
	const [bankAccountSearch, setBankAccountSearch] = React.useState("");
	const debouncedCustomerSearch = useDebounce(customerSearch, 300);
	const debouncedBankAccountSearch = useDebounce(bankAccountSearch, 300);

	const payment = paymentData?.data;
	const canEdit =
		!payment?.journalEntryId && payment?.status === PaymentStatus.RECORDED;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			contactId: "",
			date: format(new Date(), "yyyy-MM-dd"),
			amount: 0,
			paymentMethod: PaymentMethod.CASH,
			reference: "",
			bankAccountId: "",
			notes: "",
			invoiceAllocations: [],
		},
	});

	// Populate form when payment data loads
	React.useEffect(() => {
		if (payment) {
			const contactId =
				typeof payment.contactId === "string"
					? payment.contactId
					: payment.contactId._id;
			const bankAccountId =
				typeof payment.bankAccountId === "string"
					? payment.bankAccountId
					: payment.bankAccountId?._id || "";

			form.reset({
				contactId,
				date: format(new Date(payment.date), "yyyy-MM-dd"),
				amount: payment.amount,
				paymentMethod: payment.paymentMethod,
				reference: payment.reference || "",
				bankAccountId: bankAccountId || "",
				notes: payment.notes || "",
				invoiceAllocations:
					payment.invoiceAllocations?.map((alloc) => ({
						invoiceId:
							typeof alloc.invoiceId === "string"
								? alloc.invoiceId
								: alloc.invoiceId._id,
						allocatedAmount: alloc.allocatedAmount,
					})) || [],
			});
		}
	}, [payment, form]);

	const paymentMethod = form.watch("paymentMethod");
	const amount = form.watch("amount") || 0;
	const invoiceAllocations = form.watch("invoiceAllocations") || [];
	const selectedCustomerId = form.watch("contactId");

	// Fetch customers
	const { data: customersData } = useContactList({
		search:
			debouncedCustomerSearch.length > 0 ? debouncedCustomerSearch : undefined,
		type: ContactType.CUSTOMER,
		status: ContactStatus.ACTIVE,
		limit: debouncedCustomerSearch.length > 0 ? 50 : 100,
	});

	// Fetch invoices for selected customer
	const { data: invoicesData } = useInvoiceList({
		contactId: selectedCustomerId || undefined,
		status: InvoiceStatus.SENT,
		limit: 100,
	});

	// Fetch bank accounts
	const { data: bankAccountsData } = useCOAList({
		search:
			debouncedBankAccountSearch.length > 0
				? debouncedBankAccountSearch
				: undefined,
		organizationId: sessionData?.session?.activeOrganizationId || "",
		limit: debouncedBankAccountSearch.length > 0 ? 50 : 100,
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "invoiceAllocations",
	});

	// Calculate totals
	const totalAllocated = React.useMemo(() => {
		return invoiceAllocations.reduce(
			(sum, alloc) => sum + (alloc.allocatedAmount || 0),
			0
		);
	}, [invoiceAllocations]);

	const unallocatedAmount = amount - totalAllocated;

	// Filter invoices that have balance
	const availableInvoices = React.useMemo(() => {
		if (!invoicesData?.data?.docs) return [];
		return invoicesData.data.docs.filter((inv) => inv.balance > 0);
	}, [invoicesData]);

	async function onSubmit(values: FormValues) {
		if (!canEdit) {
			return;
		}

		const payload = {
			contactId: values.contactId,
			date: new Date(values.date).toISOString(),
			amount: values.amount,
			paymentMethod: values.paymentMethod,
			reference: values.reference || undefined,
			bankAccountId: values.bankAccountId || undefined,
			notes: values.notes || undefined,
		};

		updatePayment(
			{
				id: paymentId,
				data: payload,
			},
			{
				onSuccess: () => {
					router.push("/sales/payments-received");
				},
			}
		);
	}

	if (isLoadingPayment) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (!payment) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Payment not found</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Update Payment" />
			<div className="max-w-4xl mx-auto">
				{!canEdit && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							This payment cannot be edited because it has already been recorded
							and a journal entry has been created.
						</AlertDescription>
					</Alert>
				)}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className={cn("space-y-6", className)}
						{...props}>
						{/* Customer and Payment Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<h3 className="text-lg font-semibold">Customer Information</h3>
								<FormField
									control={form.control}
									name="contactId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Customer <span className="text-destructive">*</span>
											</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													setCustomerSearch("");
													form.setValue("invoiceAllocations", []);
												}}
												value={field.value}
												disabled={!canEdit}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select customer" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<div
														className="p-2 border-b"
														key="customer-search-input">
														<div className="relative">
															<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
															<Input
																placeholder="Search customer"
																value={customerSearch}
																onChange={(e) => {
																	e.stopPropagation();
																	setCustomerSearch(e.target.value);
																}}
																onClick={(e) => e.stopPropagation()}
																className="pl-8"
															/>
														</div>
													</div>
													{customersData?.data?.docs &&
													customersData.data.docs.length > 0 ? (
														customersData.data.docs.map((customer) => {
															const customerId =
																customer.id || customer._id || "";
															return (
																<SelectItem key={customerId} value={customerId}>
																	{customer.name}
																</SelectItem>
															);
														})
													) : debouncedCustomerSearch.length > 0 ? (
														<div
															className="px-2 py-1.5 text-sm text-muted-foreground text-center"
															key="customer-no-results">
															No customers found
														</div>
													) : (
														<div
															className="px-2 py-1.5 text-sm text-muted-foreground text-center"
															key="customer-loading">
															Loading customers...
														</div>
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="space-y-4">
								<h3 className="text-lg font-semibold">Payment Details</h3>
								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Date <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input type="date" {...field} disabled={!canEdit} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Amount <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													{...field}
													onChange={(e) => {
														const value = parseFloat(e.target.value) || 0;
														field.onChange(value);
													}}
													disabled={!canEdit}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="paymentMethod"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Payment Method{" "}
												<span className="text-destructive">*</span>
											</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													if (
														value === PaymentMethod.CASH ||
														value === PaymentMethod.OTHER
													) {
														form.setValue("bankAccountId", "");
													}
												}}
												value={field.value}
												disabled={!canEdit}>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={PaymentMethod.CASH}>
														Cash
													</SelectItem>
													<SelectItem value={PaymentMethod.BANK_TRANSFER}>
														Bank Transfer
													</SelectItem>
													<SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
													<SelectItem value={PaymentMethod.CARD}>
														Card
													</SelectItem>
													<SelectItem value={PaymentMethod.CHEQUE}>
														Cheque
													</SelectItem>
													<SelectItem value={PaymentMethod.OTHER}>
														Other
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{(paymentMethod === PaymentMethod.BANK_TRANSFER ||
									paymentMethod === PaymentMethod.UPI ||
									paymentMethod === PaymentMethod.CARD ||
									paymentMethod === PaymentMethod.CHEQUE) && (
									<FormField
										control={form.control}
										name="bankAccountId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Bank Account{" "}
													<span className="text-destructive">*</span>
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value || ""}
													disabled={!canEdit}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select bank account" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<div
															className="p-2 border-b"
															key="bank-search-input">
															<div className="relative">
																<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Search bank account"
																	value={bankAccountSearch}
																	onChange={(e) => {
																		e.stopPropagation();
																		setBankAccountSearch(e.target.value);
																	}}
																	onClick={(e) => e.stopPropagation()}
																	className="pl-8"
																/>
															</div>
														</div>
														{bankAccountsData?.data?.docs &&
														bankAccountsData.data.docs.length > 0 ? (
															bankAccountsData.data.docs.map((account) => {
																const accountId = account._id || "";
																return (
																	<SelectItem key={accountId} value={accountId}>
																		{account.name} ({account.code})
																	</SelectItem>
																);
															})
														) : debouncedBankAccountSearch.length > 0 ? (
															<div
																className="px-2 py-1.5 text-sm text-muted-foreground text-center"
																key="bank-no-results">
																No bank accounts found
															</div>
														) : (
															<div
																className="px-2 py-1.5 text-sm text-muted-foreground text-center"
																key="bank-loading">
																Loading bank accounts...
															</div>
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="reference"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Reference</FormLabel>
											<FormControl>
												<Input
													placeholder="Transaction ID, Cheque Number, etc."
													{...field}
													disabled={!canEdit}
												/>
											</FormControl>
											<FormDescription>
												Transaction ID, cheque number, or other reference
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Invoice Allocations - Read-only display */}
						{payment.invoiceAllocations &&
							payment.invoiceAllocations.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Invoice Allocations</h3>
									<div className="border rounded-lg">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Invoice Number</TableHead>
													<TableHead>Allocated Amount</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{payment.invoiceAllocations.map((alloc, index) => {
													const invoiceId =
														typeof alloc.invoiceId === "string"
															? alloc.invoiceId
															: alloc.invoiceId._id;
													const invoiceNumber =
														alloc.invoiceNumber ||
														(typeof alloc.invoiceId === "object"
															? alloc.invoiceId.invoiceNumber
															: "");
													return (
														<TableRow key={index}>
															<TableCell>
																{invoiceNumber || invoiceId}
															</TableCell>
															<TableCell>
																₹
																{alloc.allocatedAmount.toLocaleString("en-IN", {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
									<div className="p-4 bg-muted rounded-lg">
										<div className="text-sm font-medium">
											Total Allocated: ₹
											{payment.totalAllocated.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</div>
										<div className="text-sm text-muted-foreground">
											Unallocated: ₹
											{Math.abs(payment.unallocatedAmount).toLocaleString(
												"en-IN",
												{
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												}
											)}
										</div>
									</div>
								</div>
							)}

						{/* Notes */}
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Additional notes about this payment..."
											{...field}
											disabled={!canEdit}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Actions */}
						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.push("/sales/payments-received")}>
								Cancel
							</Button>
							{canEdit && (
								<Button type="submit" disabled={isPending}>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Updating...
										</>
									) : (
										"Update Payment"
									)}
								</Button>
							)}
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}

export default UpdatePaymentForm;
