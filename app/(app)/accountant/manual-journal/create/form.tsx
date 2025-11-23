"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
	useCreateJournal,
	useValidateJournal,
	TransactionType,
	JournalStatus,
	ValidateJournalResponse,
} from "@/queries/journal";
import { useCOAList } from "@/queries/chart-of-accounts";
import { useSession } from "@/queries/auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

// Helper to validate number string
const numberStringSchema = z.string().refine(
	(val) => {
		if (!val || val.trim() === "") return false;
		const num = parseFloat(val);
		return !isNaN(num) && num > 0;
	},
	{ message: "Must be a valid number greater than 0" }
);

const transactionSchema = z
	.object({
		accountId: z.string().min(1, "Account is required"),
		description: z.string().optional(),
		debit: z.string(),
		credit: z.string(),
	})
	.refine(
		(data) => {
			const debit = parseFloat(data.debit || "0");
			const credit = parseFloat(data.credit || "0");
			return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
		},
		{
			message: "Enter amount in either Debit or Credit, not both",
			path: ["debit"],
		}
	)
	.refine(
		(data) => {
			const debit = parseFloat(data.debit || "0");
			const credit = parseFloat(data.credit || "0");
			return debit > 0 || credit > 0;
		},
		{
			message: "Enter amount in either Debit or Credit",
			path: ["debit"],
		}
	);

const formSchema = z.object({
	name: z.string().min(1, "Journal entry name is required"),
	description: z.string().optional(),
	date: z.string().min(1, "Date is required"),
	reference: z.string().optional(),
	transactions: z
		.array(transactionSchema)
		.min(2, "At least 2 transactions are required"),
});

type FormValues = z.infer<typeof formSchema>;

function CreateJournalForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: createJournal, isPending } = useCreateJournal();
	const validateJournalMutation = useValidateJournal();
	const { data: sessionData } = useSession();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			date: format(new Date(), "yyyy-MM-dd"),
			reference: "",
			transactions: [
				{
					accountId: "",
					description: "",
					debit: "",
					credit: "",
				},
				{
					accountId: "",
					description: "",
					debit: "",
					credit: "",
				},
			],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "transactions",
	});

	const transactions = useWatch({
		control: form.control,
		name: "transactions",
		defaultValue: form.getValues("transactions"),
	});

	// Calculate totals - watch all transaction fields to ensure reactivity
	const totalDebits = React.useMemo(() => {
		if (!transactions || transactions.length === 0) return 0;
		return transactions.reduce((sum, t) => {
			if (!t) return sum;
			const debitStr = t.debit?.toString().trim() || "0";
			const debit = parseFloat(debitStr);
			return sum + (isNaN(debit) || debit < 0 ? 0 : debit);
		}, 0);
	}, [transactions]);

	const totalCredits = React.useMemo(() => {
		if (!transactions || transactions.length === 0) return 0;
		return transactions.reduce((sum, t) => {
			if (!t) return sum;
			const creditStr = t.credit?.toString().trim() || "0";
			const credit = parseFloat(creditStr);
			return sum + (isNaN(credit) || credit < 0 ? 0 : credit);
		}, 0);
	}, [transactions]);

	const isBalanced = totalDebits === totalCredits && totalDebits > 0;
	const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
	const [isValidating, setIsValidating] = React.useState(false);
	const [validationSuccess, setValidationSuccess] = React.useState(false);
	const [showSuccessText, setShowSuccessText] = React.useState(false);

	// Convert transactions to API format helper
	const convertToApiTransactions = React.useCallback(
		(transactions: FormValues["transactions"]) => {
			return transactions.map((t) => {
				const debit = parseFloat(t.debit || "0");
				const credit = parseFloat(t.credit || "0");

				// Ensure accountId is always a string (handle both string and object)
				const accountId =
					typeof t.accountId === "string"
						? t.accountId
						: (t.accountId as any)?._id || "";

				if (debit > 0) {
					return {
						amount: debit,
						type: TransactionType.DEBIT,
						accountId: accountId,
						description: t.description || undefined,
					};
				} else {
					return {
						amount: credit,
						type: TransactionType.CREDIT,
						accountId: accountId,
						description: t.description || undefined,
					};
				}
			});
		},
		[]
	);

	// Validate transactions using API
	const validateTransactions = React.useCallback(async () => {
		const values = form.getValues();

		// Check if all required fields are filled
		const hasAllFields = values.transactions.every(
			(t) => t.accountId && (t.debit || t.credit)
		);

		if (!hasAllFields || values.transactions.length < 2) {
			setValidationErrors([]);
			setValidationSuccess(false);
			toast.error(
				"Please fill in all required fields (Account and Amount) for at least 2 transactions"
			);
			return;
		}

		const apiTransactions = convertToApiTransactions(values.transactions);

		// Only validate if we have at least 2 complete transactions
		const completeTransactions = apiTransactions.filter(
			(t) => t.accountId && t.amount > 0
		);

		if (completeTransactions.length < 2) {
			setValidationErrors([]);
			setValidationSuccess(false);
			toast.error("Please ensure at least 2 transactions have valid amounts");
			return;
		}

		setIsValidating(true);
		setValidationSuccess(false);
		setShowSuccessText(false);

		// Use mutateAsync instead of mutate for better promise handling
		validateJournalMutation
			.mutateAsync({
				organizationId: sessionData?.session?.activeOrganizationId,
				transactions: completeTransactions,
			})
			.then((result) => {
				console.log("Validation result:", result);
				// Handle response that might be wrapped in data property
				const validationResult = (result as any)?.data || result;

				if (!validationResult.isValid) {
					setValidationErrors(validationResult.errors || []);
					setValidationSuccess(false);
					setShowSuccessText(false);
				} else {
					setValidationErrors([]);
					setValidationSuccess(true);
					setShowSuccessText(true);
					toast.success("Transactions validated successfully!");
					// Hide success text after 2 seconds
					setTimeout(() => {
						setShowSuccessText(false);
					}, 2000);
				}
			})
			.catch((error) => {
				console.error("Validation error:", error);
				// Validation errors are handled by the mutation's onError
				setValidationErrors([]);
				setValidationSuccess(false);
				setShowSuccessText(false);
			})
			.finally(() => {
				setIsValidating(false);
			});
	}, [
		form,
		convertToApiTransactions,
		sessionData?.session?.activeOrganizationId,
		validateJournalMutation,
	]);

	// Remove automatic debounced validation - only validate on button click
	// React.useEffect(() => {
	// 	const timer = setTimeout(() => {
	// 		validateTransactions();
	// 	}, 500);

	// 	return () => clearTimeout(timer);
	// }, [transactions, validateTransactions]);

	async function onSubmit(values: FormValues) {
		// Convert to API format
		const apiTransactions = convertToApiTransactions(values.transactions);

		// Convert date string to Date object (will be serialized to ISO string by axios)
		const dateObj = new Date(values.date);

		// Create journal entry directly (validation happens on backend)
		createJournal(
			{
				organizationId: sessionData?.session?.activeOrganizationId,
				name: values.name,
				description: values.description || undefined,
				date: dateObj.toISOString(),
				reference: values.reference || undefined,
				transactions: apiTransactions,
			},
			{
				onSuccess: () => {
					router.push("/accountant/manual-journal");
				},
			}
		);
	}

	async function onSaveDraft() {
		const values = form.getValues();
		const apiTransactions = convertToApiTransactions(values.transactions);

		// Convert date string to ISO string
		const dateObj = new Date(values.date);

		// Save as draft directly (validation happens on backend)
		createJournal(
			{
				organizationId: sessionData?.session?.activeOrganizationId,
				name: values.name,
				description: values.description || undefined,
				date: dateObj.toISOString(),
				reference: values.reference || undefined,
				transactions: apiTransactions,
			},
			{
				onSuccess: () => {
					router.push("/accountant/manual-journal");
				},
			}
		);
	}

	return (
		<div className="space-y-6 px-6 pb-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">New Journal</h2>
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className={cn("space-y-6", className)}
					{...props}>
					{/* Journal Details */}

					<div className="w-full md:w-1/2 space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Journal Entry Name{" "}
										<span className="text-destructive">*</span>
									</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Equipment Purchase" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Date <span className="text-destructive">*</span>
									</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="reference"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reference</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., EQ-001"
											{...field}
											value={field.value || ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Optional description"
											{...field}
											value={field.value || ""}
											className="min-h-[80px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator />

					{/* Account Details Table */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Transactions</h3>
							<Button
								type="button"
								variant={showSuccessText ? "default" : "outline"}
								size="sm"
								onClick={() => validateTransactions()}
								disabled={isValidating}
								className={
									showSuccessText
										? "bg-green-600 hover:bg-green-700 text-white"
										: ""
								}>
								{isValidating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Validating...
									</>
								) : showSuccessText ? (
									"Success"
								) : (
									"Validate Transactions"
								)}
							</Button>
						</div>
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[300px]">ACCOUNT</TableHead>
										<TableHead>DESCRIPTION</TableHead>
										<TableHead className="text-right">DEBITS</TableHead>
										<TableHead className="text-right">CREDITS</TableHead>
										<TableHead className="w-[50px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{fields.map((field, index) => (
										<TransactionTableRow
											key={field.id}
											index={index}
											form={form}
											onRemove={() => {
												if (fields.length > 2) {
													remove(index);
												} else {
													toast.error("At least 2 transactions are required");
												}
											}}
											canRemove={fields.length > 2}
										/>
									))}
									{/* Sub Total Row */}
									<TableRow className="bg-muted/50">
										<TableCell colSpan={2} className="font-medium">
											Sub Total
										</TableCell>
										<TableCell className="text-right font-medium">
											₹
											{totalDebits.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right font-medium">
											₹
											{totalCredits.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell></TableCell>
									</TableRow>
									{/* Total Row */}
									<TableRow className="bg-muted font-semibold">
										<TableCell colSpan={2} className="font-semibold">
											Total (₹)
										</TableCell>
										<TableCell className="text-right font-semibold">
											₹
											{totalDebits.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right font-semibold">
											₹
											{totalCredits.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell></TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								append({
									accountId: "",
									description: "",
									debit: "",
									credit: "",
								})
							}>
							<Plus className="h-4 w-4 mr-2" />
							Add New Row
						</Button>
						{!isBalanced && (
							<div className="text-sm text-destructive">
								⚠️ Debits and Credits must be equal
							</div>
						)}
						{validationErrors.length > 0 && (
							<div className="p-3 border border-destructive rounded-lg bg-destructive/10">
								<div className="text-sm font-semibold text-destructive mb-2">
									Validation Errors:
								</div>
								<ul className="list-disc list-inside space-y-1 text-sm text-destructive">
									{validationErrors.map((error, index) => (
										<li key={index}>{error}</li>
									))}
								</ul>
							</div>
						)}
					</div>

					<Separator />

					{/* Action Buttons */}
					<div className="flex items-center justify-end gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}>
							Cancel
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onSaveDraft}
							disabled={isPending}>
							Save as Draft
						</Button>
						<Button type="submit" disabled={isPending || !isBalanced}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Save and Publish
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

// Transaction Table Row Component
function TransactionTableRow({
	index,
	form,
	onRemove,
	canRemove,
}: {
	index: number;
	form: ReturnType<typeof useForm<FormValues>>;
	onRemove: () => void;
	canRemove: boolean;
}) {
	const { data: sessionData } = useSession();
	const [accountSearchQuery, setAccountSearchQuery] = React.useState("");
	const debouncedSearchQuery = useDebounce(accountSearchQuery, 300);

	const shouldFetch = debouncedSearchQuery.length > 0;
	const { data: accountsData, isLoading: isLoadingAccounts } = useCOAList(
		shouldFetch
			? {
					organizationId: sessionData?.session?.activeOrganizationId,
					page: 1,
					limit: 50,
					search: debouncedSearchQuery,
			  }
			: undefined
	);

	const displayAccounts = React.useMemo(() => {
		if (!accountsData?.data?.docs) return [];
		return accountsData.data.docs;
	}, [accountsData?.data?.docs]);

	const transaction = form.watch(`transactions.${index}`);

	return (
		<TableRow>
			<TableCell>
				<FormField
					control={form.control}
					name={`transactions.${index}.accountId`}
					render={({ field }) => (
						<FormItem>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select an account">
											{transaction.accountId &&
											displayAccounts.find(
												(a) => a._id === transaction.accountId
											)
												? `${
														displayAccounts.find(
															(a) => a._id === transaction.accountId
														)?.code
												  } - ${
														displayAccounts.find(
															(a) => a._id === transaction.accountId
														)?.name
												  }`
												: "Select an account"}
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<div className="p-2 border-b">
										<div className="relative">
											<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
											<Input
												placeholder="Search accounts..."
												value={accountSearchQuery}
												onChange={(e) => setAccountSearchQuery(e.target.value)}
												className="pl-8"
											/>
										</div>
									</div>
									{isLoadingAccounts ? (
										<div className="p-4 text-center text-sm text-muted-foreground">
											<Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
											Loading accounts...
										</div>
									) : displayAccounts.length === 0 ? (
										<div className="p-4 text-center text-sm text-muted-foreground">
											{accountSearchQuery
												? "No accounts found"
												: "Start typing to search accounts"}
										</div>
									) : (
										displayAccounts.map((account) => (
											<SelectItem key={account._id} value={account._id}>
												{account.code} - {account.name}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell>
				<FormField
					control={form.control}
					name={`transactions.${index}.description`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="Description"
									{...field}
									value={field.value || ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell>
				<FormField
					control={form.control}
					name={`transactions.${index}.debit`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									type="text"
									placeholder="0.00"
									{...field}
									onChange={(e) => {
										const value = e.target.value;
										// Allow only numbers and decimal point
										if (value === "" || /^\d*\.?\d*$/.test(value)) {
											field.onChange(value);
											// Clear credit if debit is entered
											if (value && parseFloat(value) > 0) {
												form.setValue(`transactions.${index}.credit`, "", {
													shouldValidate: true,
												});
											}
											// Trigger form update to recalculate totals
											form.trigger(`transactions.${index}.debit`);
										}
									}}
									value={field.value || ""}
									className="text-right"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell>
				<FormField
					control={form.control}
					name={`transactions.${index}.credit`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									type="text"
									placeholder="0.00"
									{...field}
									onChange={(e) => {
										const value = e.target.value;
										// Allow only numbers and decimal point
										if (value === "" || /^\d*\.?\d*$/.test(value)) {
											field.onChange(value);
											// Clear debit if credit is entered
											if (value && parseFloat(value) > 0) {
												form.setValue(`transactions.${index}.debit`, "", {
													shouldValidate: true,
												});
											}
											// Trigger form update to recalculate totals
											form.trigger(`transactions.${index}.credit`);
										}
									}}
									value={field.value || ""}
									className="text-right"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell>
				{canRemove && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onRemove}
						className="h-8 w-8 text-destructive hover:text-destructive">
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
}

export default CreateJournalForm;
