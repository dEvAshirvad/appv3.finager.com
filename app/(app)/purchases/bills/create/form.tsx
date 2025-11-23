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
	useCreateBill,
	usePostBill,
	useRecordPayment,
	PaymentMethod as BillPaymentMethod,
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
import { toast } from "sonner";

const lineItemSchema = z.object({
	itemId: z.string(),
	itemName: z.string().optional(), // Snapshot for reference
	itemCode: z.string().optional(), // Snapshot for reference
	description: z.string().optional(),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string(),
	unitPrice: z.number().nonnegative("Unit price must be non-negative"),
	discount: z.number().nonnegative("Discount must be non-negative"),
	taxRate: z.number().min(0).max(100).optional(), // GST rate
	taxableAmount: z.number().nonnegative(),
	taxAmount: z.number().nonnegative(), // CGST + SGST or IGST
	lineTotal: z.number().nonnegative(), // quantity * unitPrice - discount + tax
	hsnSacCode: z.string().optional(),
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

function CreateBillForm({ className, ...props }: React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: createBill, isPending } = useCreateBill();
	const { mutate: postBill } = usePostBill();
	const { mutate: recordPayment } = useRecordPayment();
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
					unit: "",
					discount: 0,
					description: "",
					taxRate: 0,
					taxableAmount: 0,
					taxAmount: 0,
					lineTotal: 0,
					hsnSacCode: "",
				},
			],
			discount: 0,
			notes: "",
			terms: "",
		},
	});

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

	// Calculate line item totals and update form values
	React.useEffect(() => {
		lineItems.forEach((item, index) => {
			if (item.itemId && item.quantity > 0 && item.unitPrice >= 0) {
				const quantity = item.quantity || 0;
				const unitPrice = item.unitPrice || 0;
				const discount = item.discount || 0;
				const taxRate = item.taxRate || 0;

				const subtotal = quantity * unitPrice;
				const discountAmount = (subtotal * discount) / 100;
				const taxableAmount = subtotal - discountAmount;
				const taxAmount = (taxableAmount * taxRate) / 100;
				const lineTotal = taxableAmount + taxAmount;

				// Update form values if they've changed
				const currentTaxableAmount = form.getValues(
					`lineItems.${index}.taxableAmount`
				);
				const currentTaxAmount = form.getValues(`lineItems.${index}.taxAmount`);
				const currentLineTotal = form.getValues(`lineItems.${index}.lineTotal`);

				if (currentTaxableAmount !== taxableAmount) {
					form.setValue(`lineItems.${index}.taxableAmount`, taxableAmount);
				}
				if (currentTaxAmount !== taxAmount) {
					form.setValue(`lineItems.${index}.taxAmount`, taxAmount);
				}
				if (currentLineTotal !== lineTotal) {
					form.setValue(`lineItems.${index}.lineTotal`, lineTotal);
				}
			}
		});
	}, [lineItems, form]);

	// Calculate line item totals for display
	const lineItemTotals = React.useMemo(() => {
		return lineItems.map((item) => {
			const quantity = item.quantity || 0;
			const unitPrice = item.unitPrice || 0;
			const discount = item.discount || 0;
			const taxRate = item.taxRate || 0;
			const subtotal = quantity * unitPrice;
			const discountAmount = (subtotal * discount) / 100;
			const taxableAmount = subtotal - discountAmount;
			const taxAmount = (taxableAmount * taxRate) / 100;
			const lineTotal = taxableAmount + taxAmount;
			return {
				subtotal,
				discountAmount,
				taxableAmount,
				taxAmount,
				lineTotal,
			};
		});
	}, [lineItems]);

	// Calculate bill totals
	const billTotals = React.useMemo(() => {
		const subtotal = lineItemTotals.reduce(
			(sum, item) => sum + item.subtotal,
			0
		);
		const billDiscountAmount = (subtotal * billDiscount) / 100;
		const afterDiscount = subtotal - billDiscountAmount;

		// Calculate total tax from all line items
		const taxAmount = lineItemTotals.reduce(
			(sum, item) => sum + item.taxAmount,
			0
		);

		// Total includes line item taxes (taxes are already included in lineTotal)
		const total = lineItemTotals.reduce((sum, item) => sum + item.lineTotal, 0);
		const finalTotal = total - billDiscountAmount;

		return {
			subtotal,
			billDiscountAmount,
			afterDiscount,
			taxAmount,
			total: finalTotal,
		};
	}, [lineItemTotals, billDiscount]);

	// Handle item selection - populate unit price, unit, and other fields
	const handleItemSelect = (index: number, itemId: string) => {
		const selectedItem = itemsData?.data?.docs?.find(
			(item) => item._id === itemId
		);
		if (selectedItem) {
			form.setValue(`lineItems.${index}.itemId`, itemId);
			form.setValue(`lineItems.${index}.itemName`, selectedItem.name || "");
			form.setValue(`lineItems.${index}.itemCode`, selectedItem.code || "");
			if (selectedItem.costPrice) {
				form.setValue(`lineItems.${index}.unitPrice`, selectedItem.costPrice);
			}
			if (selectedItem.unit) {
				form.setValue(`lineItems.${index}.unit`, selectedItem.unit);
			}
			if (selectedItem.hsnSacCode) {
				form.setValue(`lineItems.${index}.hsnSacCode`, selectedItem.hsnSacCode);
			}
			// Set tax rate based on item's tax preference (simplified - you may need to adjust)
			const taxRate =
				selectedItem.intraStateTaxRate || selectedItem.interStateTaxRate || 0;
			form.setValue(`lineItems.${index}.taxRate`, taxRate);

			// Recalculate line item totals
			const quantity = form.getValues(`lineItems.${index}.quantity`) || 1;
			const unitPrice = selectedItem.costPrice || 0;
			const discount = form.getValues(`lineItems.${index}.discount`) || 0;
			const subtotal = quantity * unitPrice;
			const discountAmount = (subtotal * discount) / 100;
			const taxableAmount = subtotal - discountAmount;
			const taxAmount = (taxableAmount * taxRate) / 100;
			const lineTotal = taxableAmount + taxAmount;

			form.setValue(`lineItems.${index}.taxableAmount`, taxableAmount);
			form.setValue(`lineItems.${index}.taxAmount`, taxAmount);
			form.setValue(`lineItems.${index}.lineTotal`, lineTotal);
		}
	};

	async function onSubmit(values: FormValues) {
		// Validate lineItems
		const validLineItems = values.lineItems.filter((item) => {
			if (
				!item.itemId ||
				typeof item.itemId !== "string" ||
				item.itemId.trim() === ""
			) {
				return false;
			}
			if (
				!item.unit ||
				typeof item.unit !== "string" ||
				item.unit.trim() === ""
			) {
				return false;
			}
			if (
				typeof item.quantity !== "number" ||
				isNaN(item.quantity) ||
				item.quantity <= 0
			) {
				return false;
			}
			if (
				typeof item.unitPrice !== "number" ||
				isNaN(item.unitPrice) ||
				item.unitPrice < 0
			) {
				return false;
			}
			return true;
		});

		if (validLineItems.length === 0) {
			toast.error("Please add at least one valid line item");
			return;
		}

		// Build lineItems array with ALL fields from the form
		const formattedLineItems = validLineItems.map((item) => {
			// Get item details to get unit
			const selectedItem = itemsData?.data?.docs?.find(
				(i) => i._id === item.itemId
			);

			// Get unit from form value or selected item
			const unit = item.unit || selectedItem?.unit || "";

			// Build complete line item with ALL fields
			const lineItem: any = {
				itemId: item.itemId.trim(),
				unit: unit.trim(),
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				discount: Number(item.discount) || 0,
				taxableAmount: Number(item.taxableAmount) || 0,
				taxAmount: Number(item.taxAmount) || 0,
				lineTotal: Number(item.lineTotal) || 0,
			};

			// Add optional fields if they exist
			if (
				item.itemName &&
				typeof item.itemName === "string" &&
				item.itemName.trim() !== ""
			) {
				lineItem.itemName = item.itemName.trim();
			}
			if (
				item.itemCode &&
				typeof item.itemCode === "string" &&
				item.itemCode.trim() !== ""
			) {
				lineItem.itemCode = item.itemCode.trim();
			}
			if (
				item.description &&
				typeof item.description === "string" &&
				item.description.trim() !== ""
			) {
				lineItem.description = item.description.trim();
			}
			if (
				item.taxRate !== undefined &&
				item.taxRate !== null &&
				!isNaN(Number(item.taxRate))
			) {
				lineItem.taxRate = Number(item.taxRate);
			}
			if (
				item.hsnSacCode &&
				typeof item.hsnSacCode === "string" &&
				item.hsnSacCode.trim() !== ""
			) {
				lineItem.hsnSacCode = item.hsnSacCode.trim();
			}

			return lineItem;
		});

		// Calculate totals
		const subtotal = formattedLineItems.reduce(
			(sum, item) => sum + (item.lineTotal || 0),
			0
		);
		const billDiscount = Number(values.discount) || 0;
		const billDiscountAmount = (subtotal * billDiscount) / 100;
		const total = subtotal - billDiscountAmount;
		const taxAmount = formattedLineItems.reduce(
			(sum, item) => sum + (item.taxAmount || 0),
			0
		);

		const payload: any = {
			contactId: values.contactId,
			date: new Date(values.date).toISOString(),
			paymentMethod: values.paymentMethod || BillPaymentMethod.CREDIT,
			lineItems: formattedLineItems,
			subtotal: Number(subtotal.toFixed(2)),
			total: Number(total.toFixed(2)),
			organizationId: sessionData?.session?.activeOrganizationId,
		};

		// Add all optional fields (send everything, even if empty)
		if (values.dueDate) {
			payload.dueDate = new Date(values.dueDate).toISOString();
		}
		if (values.reference !== undefined) {
			payload.reference = values.reference?.trim() || "";
		}
		if (billDiscount !== undefined) {
			payload.discount = Number(billDiscount);
		}
		if (taxAmount !== undefined) {
			payload.taxAmount = Number(taxAmount.toFixed(2));
		}
		if (values.notes !== undefined) {
			payload.notes = values.notes?.trim() || "";
		}
		if (values.terms !== undefined) {
			payload.terms = values.terms?.trim() || "";
		}

		createBill(payload, {
			onSuccess: (response) => {
				const billId = response.data.id || response.data._id;
				if (!billId) {
					toast.error("Failed to get bill ID");
					router.push("/purchases/bills");
					return;
				}

				const paymentMethod = values.paymentMethod || BillPaymentMethod.CREDIT;
				const isNonCredit = paymentMethod !== BillPaymentMethod.CREDIT;

				// If payment method is not CREDIT, automatically post and record payment
				if (isNonCredit) {
					// First post the bill
					postBill(billId, {
						onSuccess: () => {
							// Then record payment for the full amount
							recordPayment(
								{
									id: billId,
									data: {
										amount: total,
										paymentMethod: paymentMethod,
									},
								},
								{
									onSuccess: () => {
										router.push("/purchases/bills");
									},
									onError: () => {
										// If payment recording fails, still navigate
										router.push("/purchases/bills");
									},
								}
							);
						},
						onError: () => {
							// If posting fails, still navigate but show error
							router.push("/purchases/bills");
						},
					});
				} else {
					// For CREDIT, just navigate
					router.push("/purchases/bills");
				}
			},
		});
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Create Bill" />
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
												value={field.value}>
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
														suppliersData.data.docs
															.filter((supplier) => {
																const supplierId = supplier._id || supplier.id;
																return supplierId && supplierId.trim() !== "";
															})
															.map((supplier) => {
																const supplierId =
																	supplier._id || supplier.id || "";
																return (
																	<SelectItem
																		key={supplierId}
																		value={supplierId}>
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
													<Input type="date" {...field} />
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
												<Input placeholder="e.g., PUR-001" {...field} />
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
												value={field.value || BillPaymentMethod.CREDIT}>
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
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											itemId: "",
											quantity: 1,
											unitPrice: 0,
											unit: "",
											discount: 0,
											description: "",
											taxRate: 0,
											taxableAmount: 0,
											taxAmount: 0,
											lineTotal: 0,
											hsnSacCode: "",
										})
									}>
									<Plus className="mr-2 h-4 w-4" />
									Add Item
								</Button>
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
											<TableHead className="w-[50px]"></TableHead>
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
																	value={field.value || "none"}>
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
																			itemsData.data.docs
																				.filter(
																					(item) =>
																						item._id && item._id.trim() !== ""
																				)
																				.map((item) => (
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
							<Button type="submit" disabled={isPending}>
								{isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create Bill"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}

export default CreateBillForm;
