"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
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
	useUpdateBill,
	useBill,
	PaymentMethod as BillPaymentMethod,
	BillStatus,
} from "@/queries/bills";
import { useContactList, ContactType, ContactStatus } from "@/queries/contacts";
import { useItemsList, ItemStatus } from "@/queries/items";
import { useSession } from "@/queries/auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import DashTitle from "@/components/header/dash-title";

const lineItemSchema = z.object({
	itemId: z.string().min(1, "Item is required"),
	quantity: z.number().min(0.01, "Quantity must be greater than 0"),
	unitPrice: z.number().min(0, "Unit price must be greater than or equal to 0"),
	discount: z.number().min(0).max(100).optional(),
	description: z.string().optional(),
});

const formSchema = z.object({
	contactId: z.string().min(1, "Supplier is required"),
	date: z.string().min(1, "Date is required"),
	dueDate: z.string().optional(),
	reference: z.string().optional(),
	paymentMethod: z.nativeEnum(BillPaymentMethod).optional(),
	lineItems: z
		.array(lineItemSchema)
		.min(1, "At least one line item is required"),
	discount: z.number().min(0).max(100).optional(),
	notes: z.string().optional(),
	terms: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function UpdateBillForm({
	billId,
	className,
	...props
}: {
	billId: string;
} & React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: updateBill, isPending } = useUpdateBill();
	const { data: billData, isLoading: isLoadingBill } = useBill(billId);
	const { data: sessionData } = useSession();
	const [supplierSearch, setSupplierSearch] = React.useState("");
	const [itemSearch, setItemSearch] = React.useState("");
	const debouncedSupplierSearch = useDebounce(supplierSearch, 300);
	const debouncedItemSearch = useDebounce(itemSearch, 300);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			contactId: "",
			date: format(new Date(), "yyyy-MM-dd"),
			dueDate: "",
			reference: "",
			paymentMethod: BillPaymentMethod.CREDIT,
			lineItems: [
				{
					itemId: "",
					quantity: 1,
					unitPrice: 0,
					discount: 0,
					description: "",
				},
			],
			discount: 0,
			notes: "",
			terms: "",
		},
	});

	// Populate form when bill data loads
	React.useEffect(() => {
		if (billData?.data) {
			const bill = billData.data;
			const contactId =
				typeof bill.contactId === "string"
					? bill.contactId
					: bill.contactId._id;

			form.reset({
				contactId,
				date: format(new Date(bill.date), "yyyy-MM-dd"),
				dueDate: bill.dueDate
					? format(new Date(bill.dueDate), "yyyy-MM-dd")
					: "",
				reference: bill.reference || "",
				paymentMethod: bill.paymentMethod || BillPaymentMethod.CREDIT,
				lineItems: bill.lineItems.map((item) => {
					const itemId =
						typeof item.itemId === "string" ? item.itemId : item.itemId._id;
					return {
						itemId: itemId || "",
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						discount: item.discount || 0,
						description: item.description || "",
					};
				}),
				discount: bill.discount || 0,
				notes: bill.notes || "",
				terms: bill.terms || "",
			});
		}
	}, [billData, form]);

	const canEdit = billData?.data?.status === BillStatus.DRAFT;

	// Fetch suppliers
	const { data: suppliersData } = useContactList({
		search:
			debouncedSupplierSearch.length > 0 ? debouncedSupplierSearch : undefined,
		type: ContactType.VENDOR,
		status: ContactStatus.ACTIVE,
		limit: debouncedSupplierSearch.length > 0 ? 50 : 100,
	});

	// Fetch items
	const { data: itemsData } = useItemsList({
		page: 1,
		limit: debouncedItemSearch.length > 0 ? 50 : 100,
		search: debouncedItemSearch.length > 0 ? debouncedItemSearch : undefined,
		purchasable: true,
		status: ItemStatus.ACTIVE,
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lineItems",
	});

	const lineItems = useWatch({
		control: form.control,
		name: "lineItems",
		defaultValue: form.getValues("lineItems"),
	});

	const billDiscount = form.watch("discount") || 0;

	// Calculate line item totals
	const lineItemTotals = React.useMemo(() => {
		return lineItems.map((item) => {
			const quantity = item.quantity || 0;
			const unitPrice = item.unitPrice || 0;
			const discount = item.discount || 0;
			const subtotal = quantity * unitPrice;
			const discountAmount = (subtotal * discount) / 100;
			const lineTotal = subtotal - discountAmount;
			return {
				subtotal,
				discountAmount,
				lineTotal,
			};
		});
	}, [lineItems]);

	// Calculate bill totals
	const billTotals = React.useMemo(() => {
		const subtotal = lineItemTotals.reduce(
			(sum, item) => sum + item.lineTotal,
			0
		);
		const billDiscountAmount = (subtotal * billDiscount) / 100;
		const afterDiscount = subtotal - billDiscountAmount;
		const taxAmount = 0; // TODO: Calculate from item tax rates
		const total = afterDiscount + taxAmount;

		return {
			subtotal,
			billDiscountAmount,
			afterDiscount,
			taxAmount,
			total,
		};
	}, [lineItemTotals, billDiscount]);

	// Handle item selection - populate unit price
	const handleItemSelect = (index: number, itemId: string) => {
		const selectedItem = itemsData?.data?.docs?.find(
			(item) => item._id === itemId
		);
		if (selectedItem) {
			form.setValue(`lineItems.${index}.itemId`, itemId);
			if (selectedItem.costPrice) {
				form.setValue(
					`lineItems.${index}.unitPrice`,
					selectedItem.costPrice
				);
			}
		}
	};

	async function onSubmit(values: FormValues) {
		if (!canEdit) {
			return;
		}

		const payload = {
			contactId: values.contactId,
			date: new Date(values.date).toISOString(),
			dueDate: values.dueDate
				? new Date(values.dueDate).toISOString()
				: undefined,
			reference: values.reference || undefined,
			paymentMethod: values.paymentMethod || BillPaymentMethod.CREDIT,
			lineItems: values.lineItems.map((item) => ({
				itemId: item.itemId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				discount: item.discount || 0,
				description: item.description || undefined,
			})),
			discount: values.discount || 0,
			notes: values.notes || undefined,
			terms: values.terms || undefined,
		};

		updateBill(
			{
				id: billId,
				data: payload,
			},
			{
				onSuccess: () => {
					router.push("/purchases/bills");
				},
			}
		);
	}

	if (isLoadingBill) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!billData?.data) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Bill not found</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Update Bill" />
			{!canEdit && (
				<div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4">
					<p className="text-sm text-yellow-800 dark:text-yellow-200">
						This bill cannot be edited because it is not in DRAFT status.
						Current status: <strong>{billData.data.status}</strong>
					</p>
				</div>
			)}
			<div className="max-w-6xl mx-auto">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className={cn("space-y-6", className)}
						{...props}>
						{/* Supplier and Bill Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<h3 className="text-lg font-semibold">Supplier Information</h3>
								<FormField
									control={form.control}
									name="contactId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Supplier <span className="text-destructive">*</span>
											</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													setSupplierSearch("");
												}}
												value={field.value}
												disabled={!canEdit}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select supplier" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<div className="p-2 border-b">
														<div className="relative">
															<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
															<Input
																placeholder="Search supplier"
																value={supplierSearch}
																onChange={(e) => {
																	e.stopPropagation();
																	setSupplierSearch(e.target.value);
																}}
																onClick={(e) => e.stopPropagation()}
																className="pl-8"
															/>
														</div>
													</div>
													{suppliersData?.data?.docs &&
													suppliersData.data.docs.length > 0 ? (
														suppliersData.data.docs.map((supplier) => {
															const supplierId =
																supplier.id || supplier._id || "";
															return (
																<SelectItem key={supplierId} value={supplierId}>
																	{supplier.name}
																</SelectItem>
															);
														})
													) : debouncedSupplierSearch.length > 0 ? (
														<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
															No suppliers found
														</div>
													) : (
														<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
															No suppliers available
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
								<h3 className="text-lg font-semibold">Bill Details</h3>
								<div className="grid grid-cols-2 gap-4">
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
										name="dueDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Due Date</FormLabel>
												<FormControl>
													<Input
														type="date"
														{...field}
														value={field.value || ""}
														disabled={!canEdit}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="reference"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Reference</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., PUR-001"
													{...field}
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
											<FormLabel>Payment Method</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value || BillPaymentMethod.CREDIT}
												disabled={!canEdit}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select payment method" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={BillPaymentMethod.CREDIT}>
														Credit
													</SelectItem>
													<SelectItem value={BillPaymentMethod.CASH}>
														Cash
													</SelectItem>
													<SelectItem value={BillPaymentMethod.BANK_TRANSFER}>
														Bank Transfer
													</SelectItem>
													<SelectItem value={BillPaymentMethod.UPI}>
														UPI
													</SelectItem>
													<SelectItem value={BillPaymentMethod.CARD}>
														Card
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<Separator />

						{/* Line Items */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">Line Items</h3>
								{canEdit && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({
												itemId: "",
												quantity: 1,
												unitPrice: 0,
												discount: 0,
												description: "",
											})
										}>
										<Plus className="mr-2 h-4 w-4" />
										Add Item
									</Button>
								)}
							</div>

							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[300px]">Item</TableHead>
											<TableHead>Description</TableHead>
											<TableHead className="w-[100px]">Quantity</TableHead>
											<TableHead className="w-[120px]">Unit Price</TableHead>
											<TableHead className="w-[100px]">Discount %</TableHead>
											<TableHead className="w-[120px] text-right">
												Line Total
											</TableHead>
											{canEdit && <TableHead className="w-[50px]"></TableHead>}
										</TableRow>
									</TableHeader>
									<TableBody>
										{fields.map((field, index) => (
											<TableRow key={field.id}>
												<TableCell>
													<FormField
														control={form.control}
														name={`lineItems.${index}.itemId`}
														render={({ field }) => (
															<FormItem>
																<Select
																	onValueChange={(value) => {
																		field.onChange(value);
																		handleItemSelect(index, value);
																		setItemSearch("");
																	}}
																	value={field.value || "none"}
																	disabled={!canEdit}>
																	<FormControl>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Select item" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent className="max-h-[300px]">
																		<div
																			key="item-search-input"
																			className="p-2 border-b sticky top-0 bg-background z-10">
																			<div className="relative">
																				<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
																				<Input
																					placeholder="Search item"
																					value={itemSearch}
																					onChange={(e) => {
																						e.stopPropagation();
																						setItemSearch(e.target.value);
																					}}
																					onClick={(e) => e.stopPropagation()}
																					className="pl-8"
																				/>
																			</div>
																		</div>
																		{itemsData?.data?.docs &&
																		itemsData.data.docs.length > 0 ? (
																			itemsData.data.docs.map((item) => (
																				<SelectItem
																					key={item._id}
																					value={item._id}
																					className="pl-4">
																					<div className="flex flex-col">
																						<span className="font-medium">
																							{item.name}
																						</span>
																						<span className="text-xs text-muted-foreground">
																							{item.code} • ₹
																							{item.costPrice?.toLocaleString(
																								"en-IN"
																							) || "0.00"}
																						</span>
																					</div>
																				</SelectItem>
																			))
																		) : debouncedItemSearch.length > 0 ? (
																			<div
																				key="no-items-found"
																				className="px-2 py-1.5 text-sm text-muted-foreground text-center">
																				No items found
																			</div>
																		) : itemsData?.data?.docs &&
																		  itemsData.data.docs.length === 0 ? (
																			<div
																				key="no-items-available"
																				className="px-2 py-1.5 text-sm text-muted-foreground text-center">
																				No items available
																			</div>
																		) : null}
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
														name={`lineItems.${index}.description`}
														render={({ field }) => (
															<FormItem>
																<FormControl>
																	<Input
																		placeholder="Description"
																		{...field}
																		value={field.value || ""}
																		disabled={!canEdit}
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
														name={`lineItems.${index}.quantity`}
														render={({ field }) => (
															<FormItem>
																<FormControl>
																	<Input
																		type="number"
																		step="0.01"
																		placeholder="0"
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number(e.target.value)
																					: 0
																			)
																		}
																		disabled={!canEdit}
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
														name={`lineItems.${index}.unitPrice`}
														render={({ field }) => (
															<FormItem>
																<FormControl>
																	<Input
																		type="number"
																		step="0.01"
																		placeholder="0.00"
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number(e.target.value)
																					: 0
																			)
																		}
																		disabled={!canEdit}
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
														name={`lineItems.${index}.discount`}
														render={({ field }) => (
															<FormItem>
																<FormControl>
																	<Input
																		type="number"
																		step="0.01"
																		min="0"
																		max="100"
																		placeholder="0"
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number(e.target.value)
																					: 0
																			)
																		}
																		disabled={!canEdit}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</TableCell>
												<TableCell className="text-right font-medium">
													₹
													{lineItemTotals[index]?.lineTotal.toLocaleString(
														"en-IN",
														{
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														}
													) || "0.00"}
												</TableCell>
												{canEdit && (
													<TableCell>
														{fields.length > 1 && (
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() => remove(index)}>
																<Trash2 className="h-4 w-4" />
															</Button>
														)}
													</TableCell>
												)}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						<Separator />

						{/* Totals */}
						<div className="flex justify-end">
							<div className="w-full md:w-1/2 space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Subtotal</span>
									<span className="font-medium">
										₹
										{billTotals.subtotal.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Discount</span>
									<div className="flex items-center gap-2">
										<FormField
											control={form.control}
											name="discount"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															max="100"
															className="w-20 h-8"
															{...field}
															value={field.value ?? ""}
															onChange={(e) =>
																field.onChange(
																	e.target.value ? Number(e.target.value) : 0
																)
															}
															disabled={!canEdit}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<span>%</span>
										<span className="font-medium">
											₹
											{billTotals.billDiscountAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
									</div>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Tax</span>
									<span className="font-medium">
										₹
										{billTotals.taxAmount.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-lg font-bold">
									<span>Total</span>
									<span>
										₹
										{billTotals.total.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
							</div>
						</div>

						<Separator />

						{/* Notes and Terms */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Additional notes..."
												className="resize-none"
												rows={4}
												{...field}
												value={field.value || ""}
												disabled={!canEdit}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="terms"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Terms & Conditions</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Payment terms and conditions..."
												className="resize-none"
												rows={4}
												{...field}
												value={field.value || ""}
												disabled={!canEdit}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-end gap-4 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.push("/purchases/bills")}>
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
										"Update Bill"
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

export default UpdateBillForm;

