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
	useCreateInvoice,
	usePostInvoice,
	useRecordPayment,
	PaymentMethod,
} from "@/queries/invoices";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useInvoiceList } from "@/queries/invoices";
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
	invoiceNumber: z.string().optional(),
	contactId: z.string().min(1, "Customer is required"),
	date: z.string().min(1, "Date is required"),
	dueDate: z.string().optional(),
	reference: z.string().optional(),
	paymentMethod: z.nativeEnum(PaymentMethod),
	lineItems: z
		.array(lineItemSchema)
		.min(1, "At least one line item is required"),
	discount: z.number().min(0).max(100).optional(),
	notes: z.string().optional(),
	terms: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function CreateInvoiceForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: createInvoice, isPending } = useCreateInvoice();
	const { mutate: postInvoice } = usePostInvoice();
	const { mutate: recordPayment } = useRecordPayment();
	const { data: sessionData } = useSession();
	const [customerSearch, setCustomerSearch] = React.useState("");
	const [itemSearch, setItemSearch] = React.useState("");
	const debouncedCustomerSearch = useDebounce(customerSearch, 300);
	const debouncedItemSearch = useDebounce(itemSearch, 300);

	// Invoice number configuration state
	const [showConfigModal, setShowConfigModal] = React.useState(false);
	const [autoGenerate, setAutoGenerate] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("invoice-auto-generate");
			return saved !== null ? saved === "true" : true;
		}
		return true;
	});
	const [invoicePrefix, setInvoicePrefix] = React.useState(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("invoice-prefix") || "INV-";
		}
		return "INV-";
	});
	const [nextNumber, setNextNumber] = React.useState(() => {
		if (typeof window !== "undefined") {
			return parseInt(localStorage.getItem("invoice-next-number") || "1", 10);
		}
		return 1;
	});

	// Generate invoice number based on settings
	const generateInvoiceNumber = React.useCallback(() => {
		if (!autoGenerate) return "";
		const paddedNumber = String(nextNumber).padStart(6, "0");
		return `${invoicePrefix}${paddedNumber}`;
	}, [autoGenerate, invoicePrefix, nextNumber]);

	// Fetch last invoice to get the next number
	const { data: lastInvoiceData } = useInvoiceList({
		page: 1,
		limit: 1,
		sort: "-createdAt",
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	// Extract next number from last invoice
	React.useEffect(() => {
		if (lastInvoiceData?.data?.docs?.[0]?.invoiceNumber && autoGenerate) {
			const lastInvoiceNumber = lastInvoiceData.data.docs[0].invoiceNumber;
			const savedPrefix = localStorage.getItem("invoice-prefix") || "INV-";

			// Extract number from invoice number (e.g., "INV-000001" -> 1)
			if (lastInvoiceNumber.startsWith(savedPrefix)) {
				const numberPart = lastInvoiceNumber.replace(savedPrefix, "");
				const lastNumber = parseInt(numberPart, 10);
				if (!isNaN(lastNumber)) {
					setNextNumber(lastNumber + 1);
					if (typeof window !== "undefined") {
						localStorage.setItem("invoice-next-number", String(lastNumber + 1));
					}
				}
			}
		}
	}, [lastInvoiceData, autoGenerate]);

	// Fetch customers - always fetch, show all by default
	const { data: customersData } = useContactList({
		organizationId: sessionData?.session?.activeOrganizationId,
		page: 1,
		limit: debouncedCustomerSearch.length > 0 ? 50 : 100,
		search:
			debouncedCustomerSearch.length > 0 ? debouncedCustomerSearch : undefined,
		type: ContactType.CUSTOMER,
		status: ContactStatus.ACTIVE,
	});

	// Fetch items - always fetch, show all by default
	const { data: itemsData } = useItemsList({
		page: 1,
		limit: debouncedItemSearch.length > 0 ? 50 : 100,
		search: debouncedItemSearch.length > 0 ? debouncedItemSearch : undefined,
		sellable: true,
		status: ItemStatus.ACTIVE,
	});

	const initialInvoiceNumber = React.useMemo(
		() => (autoGenerate ? generateInvoiceNumber() : ""),
		[autoGenerate, generateInvoiceNumber]
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			invoiceNumber: initialInvoiceNumber,
			contactId: "",
			date: format(new Date(), "yyyy-MM-dd"),
			dueDate: "",
			reference: "",
			paymentMethod: PaymentMethod.CREDIT,
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

	// Update invoice number when auto-generate settings change
	React.useEffect(() => {
		if (autoGenerate) {
			form.setValue("invoiceNumber", generateInvoiceNumber());
		} else {
			form.setValue("invoiceNumber", "");
		}
	}, [autoGenerate, invoicePrefix, nextNumber, generateInvoiceNumber, form]);

	// Update invoice number when auto-generate settings change
	React.useEffect(() => {
		if (autoGenerate) {
			form.setValue("invoiceNumber", generateInvoiceNumber());
		}
	}, [autoGenerate, invoicePrefix, nextNumber, generateInvoiceNumber, form]);

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lineItems",
	});

	const lineItems = useWatch({
		control: form.control,
		name: "lineItems",
		defaultValue: form.getValues("lineItems"),
	});

	const invoiceDiscount = form.watch("discount") || 0;

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

	// Calculate invoice totals
	const invoiceTotals = React.useMemo(() => {
		const subtotal = lineItemTotals.reduce(
			(sum, item) => sum + item.subtotal,
			0
		);
		const invoiceDiscountAmount = (subtotal * invoiceDiscount) / 100;
		const afterDiscount = subtotal - invoiceDiscountAmount;

		// Calculate total tax from all line items
		const taxAmount = lineItemTotals.reduce(
			(sum, item) => sum + item.taxAmount,
			0
		);

		// Total includes line item taxes (taxes are already included in lineTotal)
		const total = lineItemTotals.reduce((sum, item) => sum + item.lineTotal, 0);
		const finalTotal = total - invoiceDiscountAmount;

		return {
			subtotal,
			invoiceDiscountAmount,
			afterDiscount,
			taxAmount,
			total: finalTotal,
		};
	}, [lineItemTotals, invoiceDiscount]);

	// Handle item selection - populate unit price, unit, and other fields
	const handleItemSelect = (index: number, itemId: string) => {
		const selectedItem = itemsData?.data?.docs?.find(
			(item) => item._id === itemId
		);
		if (selectedItem) {
			form.setValue(`lineItems.${index}.itemId`, itemId);
			form.setValue(`lineItems.${index}.itemName`, selectedItem.name || "");
			form.setValue(`lineItems.${index}.itemCode`, selectedItem.code || "");
			if (selectedItem.sellingPrice) {
				form.setValue(
					`lineItems.${index}.unitPrice`,
					selectedItem.sellingPrice
				);
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
			const unitPrice = selectedItem.sellingPrice || 0;
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
		// Validate contactId first
		if (
			!values.contactId ||
			typeof values.contactId !== "string" ||
			values.contactId.trim() === ""
		) {
			toast.error("Please select a customer");
			return;
		}

		// Validate lineItems array exists and is not empty
		if (
			!values.lineItems ||
			!Array.isArray(values.lineItems) ||
			values.lineItems.length === 0
		) {
			toast.error("Please add at least one line item");
			return;
		}

		// Filter out invalid line items (must have itemId, unit, quantity > 0, unitPrice >= 0)
		const validLineItems = values.lineItems.filter((item) => {
			if (!item || typeof item !== "object") return false;
			if (
				!item.itemId ||
				typeof item.itemId !== "string" ||
				item.itemId.trim() === ""
			)
				return false;
			if (
				!item.unit ||
				typeof item.unit !== "string" ||
				item.unit.trim() === ""
			)
				return false;
			if (
				typeof item.quantity !== "number" ||
				isNaN(item.quantity) ||
				item.quantity <= 0
			)
				return false;
			if (
				typeof item.unitPrice !== "number" ||
				isNaN(item.unitPrice) ||
				item.unitPrice < 0
			)
				return false;
			return true;
		});

		if (validLineItems.length === 0) {
			toast.error("Please add at least one valid line item");
			return;
		}

		// Double-check: ensure we have valid line items with all required fields
		if (
			validLineItems.some(
				(item) =>
					!item.itemId ||
					!item.quantity ||
					item.quantity <= 0 ||
					item.unitPrice < 0
			)
		) {
			toast.error(
				"Please ensure all line items have valid item, quantity, and unit price"
			);
			return;
		}

		// Calculate totals from valid line items first (before final filtering)
		const lineItemTotals = validLineItems.map((item) => {
			const quantity = Number(item.quantity) || 0;
			const unitPrice = Number(item.unitPrice) || 0;
			const discount = Number(item.discount) || 0;
			const subtotal = quantity * unitPrice;
			const discountAmount = (subtotal * discount) / 100;
			const lineTotal = subtotal - discountAmount;
			return lineTotal;
		});

		let subtotal = lineItemTotals.reduce((sum, total) => sum + total, 0);
		const invoiceDiscount = Number(values.discount) || 0;
		const invoiceDiscountAmount = (subtotal * invoiceDiscount) / 100;
		const afterDiscount = subtotal - invoiceDiscountAmount;
		const taxAmount = 0; // TODO: Calculate from item tax rates
		let total = afterDiscount + taxAmount;

		// Build lineItems array with ALL fields from the form
		const formattedLineItems = validLineItems
			.map((item) => {
				// Validate that itemId is a non-empty string
				if (
					!item.itemId ||
					typeof item.itemId !== "string" ||
					item.itemId.trim() === ""
				) {
					return null;
				}

				// Get item details to get unit
				const selectedItem = itemsData?.data?.docs?.find(
					(i) => i._id === item.itemId
				);

				// Validate quantity is a positive number
				const quantity = Number(item.quantity);
				if (isNaN(quantity) || quantity <= 0) {
					return null;
				}

				// Validate unitPrice is a non-negative number
				const unitPrice = Number(item.unitPrice);
				if (isNaN(unitPrice) || unitPrice < 0) {
					return null;
				}

				// Get unit from form value or selected item
				const unit = item.unit || selectedItem?.unit || "";

				// Build complete line item with ALL fields
				const lineItem: any = {
					itemId: item.itemId.trim(),
					unit: unit.trim(),
					quantity: quantity,
					unitPrice: unitPrice,
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
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);

		// Ensure formattedLineItems is not empty
		if (formattedLineItems.length === 0) {
			toast.error(
				"Please add at least one valid line item with item, quantity, and unit price"
			);
			return;
		}

		// Use formattedLineItems directly - they already have all fields
		const finalLineItems = formattedLineItems;

		if (finalLineItems.length === 0) {
			toast.error(
				"Please add at least one valid line item with item, quantity, and unit price"
			);
			return;
		}

		// Recalculate totals from final line items to ensure accuracy
		const finalLineItemTotals = finalLineItems.map((item) => {
			const quantity = item.quantity;
			const unitPrice = item.unitPrice;
			const discount = item.discount || 0;
			const itemSubtotal = quantity * unitPrice;
			const itemDiscountAmount = (itemSubtotal * discount) / 100;
			return itemSubtotal - itemDiscountAmount;
		});

		subtotal = finalLineItemTotals.reduce((sum, total) => sum + total, 0);
		const finalInvoiceDiscountAmount = (subtotal * invoiceDiscount) / 100;
		const finalAfterDiscount = subtotal - finalInvoiceDiscountAmount;
		total = finalAfterDiscount + taxAmount;

		// Build payload with ALL fields from the form
		const payload: any = {
			contactId: String(values.contactId).trim(),
			date: new Date(values.date).toISOString(),
			paymentMethod: values.paymentMethod,
			lineItems: finalLineItems,
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
		if (values.discount !== undefined) {
			payload.discount = Number(invoiceDiscount);
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
		if (values.invoiceNumber !== undefined) {
			payload.invoiceNumber = values.invoiceNumber?.trim() || "";
		}

		// Debug: Log the payload to see what we're sending
		console.log("Invoice payload:", JSON.stringify(payload, null, 2));
		console.log("LineItems:", JSON.stringify(finalLineItems, null, 2));

		createInvoice(payload, {
			onSuccess: (response) => {
				const invoiceId = response.data.id || response.data._id;
				const isNonCredit = values.paymentMethod !== PaymentMethod.CREDIT;

				// If payment method is not CREDIT, automatically post and record payment
				if (isNonCredit) {
					// First post the invoice
					postInvoice(invoiceId, {
						onSuccess: () => {
							// Then record payment for the full amount
							recordPayment(
								{
									id: invoiceId,
									data: {
										amount: total,
										paymentMethod: values.paymentMethod,
									},
								},
								{
									onSuccess: () => {
										// Increment next number if auto-generate is enabled
										if (autoGenerate) {
											const newNextNumber = nextNumber + 1;
											setNextNumber(newNextNumber);
											if (typeof window !== "undefined") {
												localStorage.setItem(
													"invoice-next-number",
													String(newNextNumber)
												);
											}
										}
										router.push("/sales/invoices");
									},
									onError: () => {
										// If payment recording fails, still navigate
										router.push("/sales/invoices");
									},
								}
							);
						},
						onError: () => {
							// If posting fails, still navigate but show error
							router.push("/sales/invoices");
						},
					});
				} else {
					// For CREDIT, just increment number and navigate
					if (autoGenerate) {
						const newNextNumber = nextNumber + 1;
						setNextNumber(newNextNumber);
						if (typeof window !== "undefined") {
							localStorage.setItem(
								"invoice-next-number",
								String(newNextNumber)
							);
						}
					}
					router.push("/sales/invoices");
				}
			},
		});
	}

	// Handle configuration save
	const handleSaveConfig = () => {
		if (typeof window !== "undefined") {
			localStorage.setItem("invoice-auto-generate", String(autoGenerate));
			localStorage.setItem("invoice-prefix", invoicePrefix);
			localStorage.setItem("invoice-next-number", String(nextNumber));
		}
		if (autoGenerate) {
			form.setValue("invoiceNumber", generateInvoiceNumber());
		}
		setShowConfigModal(false);
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className={cn("space-y-6", className)}
					{...props}>
					{/* Customer and Invoice Details */}
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
											}}
											value={field.value}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select customer" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<div className="p-2 border-b">
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
													<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
														No customers found
													</div>
												) : (
													<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
														No customers available
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
							<h3 className="text-lg font-semibold">Invoice Details</h3>
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
											<Input placeholder="e.g., SAL-001" {...field} />
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
											value={field.value || PaymentMethod.CREDIT}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select payment method" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={PaymentMethod.CREDIT}>
													Credit
												</SelectItem>
												<SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
												<SelectItem value={PaymentMethod.BANK_TRANSFER}>
													Bank Transfer
												</SelectItem>
												<SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
												<SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
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
																						{item.sellingPrice?.toLocaleString(
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
									{invoiceTotals.subtotal.toLocaleString("en-IN", {
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
										{invoiceTotals.invoiceDiscountAmount.toLocaleString(
											"en-IN",
											{
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											}
										)}
									</span>
								</div>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Tax</span>
								<span className="font-medium">
									₹
									{invoiceTotals.taxAmount.toLocaleString("en-IN", {
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
									{invoiceTotals.total.toLocaleString("en-IN", {
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
							onClick={() => router.push("/sales/invoices")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Invoice"
							)}
						</Button>
					</div>
				</form>
			</Form>

			{/* Invoice Number Configuration Modal */}
			<Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Configure Invoice Number Preferences</DialogTitle>
						<DialogDescription>
							Your invoice numbers are set on auto-generate mode to save your
							time. Are you sure about changing this setting?
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4">
						<RadioGroup
							value={autoGenerate ? "auto" : "manual"}
							onValueChange={(value) => setAutoGenerate(value === "auto")}>
							<div className="flex items-start space-x-3 space-y-0">
								<RadioGroupItem value="auto" id="auto" className="mt-1" />
								<div className="space-y-1 flex-1">
									<Label
										htmlFor="auto"
										className="flex items-center gap-2 cursor-pointer">
										Continue auto-generating invoice numbers
										<Info className="h-4 w-4 text-muted-foreground" />
									</Label>
									{autoGenerate && (
										<div className="grid grid-cols-2 gap-4 mt-3 ml-6">
											<div className="space-y-2">
												<Label
													htmlFor="prefix"
													className="text-sm text-muted-foreground">
													Prefix
												</Label>
												<Input
													id="prefix"
													value={invoicePrefix}
													onChange={(e) => setInvoicePrefix(e.target.value)}
													placeholder="INV-"
												/>
											</div>
											<div className="space-y-2">
												<Label
													htmlFor="next-number"
													className="text-sm text-muted-foreground">
													Next Number
												</Label>
												<Input
													id="next-number"
													type="number"
													value={nextNumber}
													onChange={(e) =>
														setNextNumber(parseInt(e.target.value, 10) || 1)
													}
													min="1"
												/>
											</div>
										</div>
									)}
								</div>
							</div>
							<div className="flex items-start space-x-3 space-y-0 mt-4">
								<RadioGroupItem value="manual" id="manual" className="mt-1" />
								<div className="space-y-1 flex-1">
									<Label htmlFor="manual" className="cursor-pointer">
										Enter invoice numbers manually
									</Label>
								</div>
							</div>
						</RadioGroup>
					</div>
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowConfigModal(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSaveConfig}>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CreateInvoiceForm;
