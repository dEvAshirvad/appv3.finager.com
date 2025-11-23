"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Loader2, HelpCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	useUpdateItem,
	useItem,
	ItemType,
	TaxPreference,
	useSuggestHSN,
} from "@/queries/items";
import { useCOAList, AccountType } from "@/queries/chart-of-accounts";
import { useContactList, ContactType, ContactStatus } from "@/queries/contacts";
import { useSession } from "@/queries/auth";
import { useDebounce } from "@/hooks/use-debounce";

const formSchema = z
	.object({
		code: z.string().optional(),
		name: z.string().min(2, "Name must be at least 2 characters"),
		nameHindi: z.string().optional(),
		nameAssamese: z.string().optional(),
		nameBodo: z.string().optional(),
		type: z.nativeEnum(ItemType),
		unit: z.string().min(1, "Unit is required"),
		hsnSacCode: z.string().optional(),
		isTaxable: z.boolean().optional(),
		intraStateTaxRate: z.number().min(0).max(100).optional(),
		interStateTaxRate: z.number().min(0).max(100).optional(),
		taxPreference: z.nativeEnum(TaxPreference),
		sellable: z.boolean().optional(),
		sellingPrice: z.number().min(0).optional(),
		salesAccountId: z.string().optional(),
		salesDescription: z.string().optional(),
		purchasable: z.boolean().optional(),
		costPrice: z.number().min(0).optional(),
		purchaseAccountId: z.string().optional(),
		purchaseDescription: z.string().optional(),
		preferredVendorId: z.string().optional(),
		trackInventory: z.boolean().optional(),
		openingStock: z.number().min(0).optional(),
		openingStockRate: z.number().min(0).optional(),
		inventoryAccountId: z.string().optional(),
		lowStockAlert: z.number().min(0).optional(),
		barcode: z.string().optional(),
		imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
	})
	.refine(
		(data) => {
			if (data.sellable && !data.sellingPrice) {
				return false;
			}
			return true;
		},
		{
			message: "Selling price is required when item is sellable",
			path: ["sellingPrice"],
		}
	)
	.refine(
		(data) => {
			if (data.purchasable && !data.costPrice) {
				return false;
			}
			return true;
		},
		{
			message: "Cost price is required when item is purchasable",
			path: ["costPrice"],
		}
	)
	.refine(
		(data) => {
			if (data.trackInventory && data.openingStock && !data.openingStockRate) {
				return false;
			}
			return true;
		},
		{
			message: "Opening stock rate is required when opening stock is provided",
			path: ["openingStockRate"],
		}
	)
	.refine(
		(data) => {
			if (data.trackInventory && !data.inventoryAccountId) {
				return false;
			}
			return true;
		},
		{
			message: "Inventory account is required when tracking inventory",
			path: ["inventoryAccountId"],
		}
	);

type FormValues = z.infer<typeof formSchema>;

function UpdateItemForm({
	itemId,
	className,
	...props
}: {
	itemId: string;
} & React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: updateItem, isPending } = useUpdateItem();
	const { data: sessionData } = useSession();
	const { data: itemData, isLoading: isLoadingItem } = useItem(itemId);
	const [hsnQuery, setHsnQuery] = React.useState("");

	// Account search states
	const [salesAccountSearch, setSalesAccountSearch] = React.useState("");
	const [purchaseAccountSearch, setPurchaseAccountSearch] = React.useState("");
	const [inventoryAccountSearch, setInventoryAccountSearch] =
		React.useState("");
	const [vendorSearch, setVendorSearch] = React.useState("");

	const debouncedSalesAccountSearch = useDebounce(salesAccountSearch, 300);
	const debouncedPurchaseAccountSearch = useDebounce(
		purchaseAccountSearch,
		300
	);
	const debouncedInventoryAccountSearch = useDebounce(
		inventoryAccountSearch,
		300
	);
	const debouncedVendorSearch = useDebounce(vendorSearch, 300);

	const { data: hsnSuggestions } = useSuggestHSN(hsnQuery, 5);

	// COA Account searches
	const { data: salesAccountsDataRaw } = useCOAList(
		debouncedSalesAccountSearch.length > 0
			? {
					organizationId: sessionData?.session?.activeOrganizationId,
					page: 1,
					limit: 50,
					search: debouncedSalesAccountSearch,
			  }
			: undefined
	);

	const { data: purchaseAccountsDataRaw } = useCOAList(
		debouncedPurchaseAccountSearch.length > 0
			? {
					organizationId: sessionData?.session?.activeOrganizationId,
					page: 1,
					limit: 50,
					search: debouncedPurchaseAccountSearch,
			  }
			: undefined
	);

	const { data: inventoryAccountsDataRaw } = useCOAList(
		debouncedInventoryAccountSearch.length > 0
			? {
					organizationId: sessionData?.session?.activeOrganizationId,
					page: 1,
					limit: 50,
					search: debouncedInventoryAccountSearch,
			  }
			: undefined
	);

	// Filter accounts by type client-side
	const salesAccountsData = React.useMemo(() => {
		if (!salesAccountsDataRaw?.data?.docs) return null;
		return {
			...salesAccountsDataRaw,
			data: {
				...salesAccountsDataRaw.data,
				docs: salesAccountsDataRaw.data.docs.filter(
					(acc) => acc.type === AccountType.INCOME
				),
			},
		};
	}, [salesAccountsDataRaw]);

	const inventoryAccountsData = React.useMemo(() => {
		if (!inventoryAccountsDataRaw?.data?.docs) return null;
		return {
			...inventoryAccountsDataRaw,
			data: {
				...inventoryAccountsDataRaw.data,
				docs: inventoryAccountsDataRaw.data.docs.filter(
					(acc) => acc.type === AccountType.ASSET
				),
			},
		};
	}, [inventoryAccountsDataRaw]);

	const purchaseAccountsData = purchaseAccountsDataRaw;

	// Vendor search - always fetch, show 5 by default when no search query
	const { data: vendorsData } = useContactList({
		organizationId: sessionData?.session?.activeOrganizationId,
		page: 1,
		limit: debouncedVendorSearch.length > 0 ? 50 : 5,
		search:
			debouncedVendorSearch.length > 0 ? debouncedVendorSearch : undefined,
		type: ContactType.VENDOR,
		status: ContactStatus.ACTIVE,
	});

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			code: "",
			name: "",
			nameHindi: "",
			nameAssamese: "",
			nameBodo: "",
			type: ItemType.GOODS,
			unit: "",
			hsnSacCode: "",
			isTaxable: true,
			intraStateTaxRate: undefined,
			interStateTaxRate: undefined,
			taxPreference: TaxPreference.TAXABLE,
			sellable: true,
			sellingPrice: undefined,
			salesAccountId: "",
			salesDescription: "",
			purchasable: true,
			costPrice: undefined,
			purchaseAccountId: "",
			purchaseDescription: "",
			preferredVendorId: "",
			trackInventory: false,
			openingStock: undefined,
			openingStockRate: undefined,
			inventoryAccountId: "",
			lowStockAlert: undefined,
			barcode: "",
			imageUrl: "",
		},
	});

	const itemType = form.watch("type");
	const sellable = form.watch("sellable");
	const purchasable = form.watch("purchasable");
	const trackInventory = form.watch("trackInventory");
	const isTaxable = form.watch("isTaxable");

	// Reset form when item data is loaded
	useEffect(() => {
		if (itemData?.data) {
			const item = itemData.data;
			form.reset({
				code: item.code || "",
				name: item.name || "",
				nameHindi: item.nameHindi || "",
				nameAssamese: item.nameAssamese || "",
				nameBodo: item.nameBodo || "",
				type: item.type || ItemType.GOODS,
				unit: item.unit || "",
				hsnSacCode: item.hsnSacCode || "",
				isTaxable: item.isTaxable ?? true,
				intraStateTaxRate: item.intraStateTaxRate,
				interStateTaxRate: item.interStateTaxRate,
				taxPreference: item.taxPreference || TaxPreference.TAXABLE,
				sellable: item.sellable ?? true,
				sellingPrice: item.sellingPrice,
				salesAccountId: item.salesAccountId || "",
				salesDescription: item.salesDescription || "",
				purchasable: item.purchasable ?? true,
				costPrice: item.costPrice,
				purchaseAccountId: item.purchaseAccountId || "",
				purchaseDescription: item.purchaseDescription || "",
				preferredVendorId: item.preferredVendorId || "",
				trackInventory: item.trackInventory ?? false,
				openingStock: item.openingStock,
				openingStockRate: item.openingStockRate,
				inventoryAccountId: item.inventoryAccountId || "",
				lowStockAlert: item.lowStockAlert,
				barcode: item.barcode || "",
				imageUrl: item.imageUrl || "",
			});
		}
	}, [itemData, form]);

	async function onSubmit(values: FormValues) {
		const payload: any = {
			name: values.name,
			type: values.type,
			unit: values.unit,
		};

		if (values.code) payload.code = values.code;
		if (values.nameHindi) payload.nameHindi = values.nameHindi;
		if (values.nameAssamese) payload.nameAssamese = values.nameAssamese;
		if (values.nameBodo) payload.nameBodo = values.nameBodo;
		if (values.hsnSacCode) payload.hsnSacCode = values.hsnSacCode;
		if (values.barcode) payload.barcode = values.barcode;
		if (values.imageUrl) payload.imageUrl = values.imageUrl;

		// Tax fields
		payload.isTaxable = values.isTaxable ?? true;
		payload.taxPreference = values.taxPreference;
		if (values.isTaxable && values.intraStateTaxRate !== undefined) {
			payload.intraStateTaxRate = values.intraStateTaxRate;
		}
		if (values.isTaxable && values.interStateTaxRate !== undefined) {
			payload.interStateTaxRate = values.interStateTaxRate;
		}

		// Sales fields
		payload.sellable = values.sellable ?? false;
		if (values.sellable) {
			if (values.sellingPrice !== undefined)
				payload.sellingPrice = values.sellingPrice;
			if (values.salesAccountId) payload.salesAccountId = values.salesAccountId;
			if (values.salesDescription)
				payload.salesDescription = values.salesDescription;
		}

		// Purchase fields
		payload.purchasable = values.purchasable ?? false;
		if (values.purchasable) {
			if (values.costPrice !== undefined) payload.costPrice = values.costPrice;
			if (values.purchaseAccountId)
				payload.purchaseAccountId = values.purchaseAccountId;
			if (values.purchaseDescription)
				payload.purchaseDescription = values.purchaseDescription;
			if (values.preferredVendorId)
				payload.preferredVendorId = values.preferredVendorId;
		}

		// Inventory fields
		payload.trackInventory = values.trackInventory ?? false;
		if (values.trackInventory) {
			if (values.openingStock !== undefined)
				payload.openingStock = values.openingStock;
			if (values.openingStockRate !== undefined)
				payload.openingStockRate = values.openingStockRate;
			if (values.inventoryAccountId)
				payload.inventoryAccountId = values.inventoryAccountId;
			if (values.lowStockAlert !== undefined)
				payload.lowStockAlert = values.lowStockAlert;
		}

		updateItem(
			{
				id: itemId,
				data: payload,
			},
			{
				onSuccess: () => {
					router.push("/items");
				},
			}
		);
	}

	if (isLoadingItem) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!itemData?.data) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Item not found</p>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className={cn("space-y-8", className)}
					{...props}>
					{/* Item Type */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<FormLabel className="text-base font-semibold">Type</FormLabel>
							<HelpCircle className="h-4 w-4 text-muted-foreground" />
						</div>
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											value={field.value}
											className="flex gap-6 flex-wrap">
											<div className="flex items-center space-x-2">
												<RadioGroupItem value={ItemType.GOODS} id="goods" />
												<Label
													htmlFor="goods"
													className="font-normal cursor-pointer">
													Goods
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value={ItemType.SERVICE} id="service" />
												<Label
													htmlFor="service"
													className="font-normal cursor-pointer">
													Service
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem
													value={ItemType.COMPOSITE}
													id="composite"
												/>
												<Label
													htmlFor="composite"
													className="font-normal cursor-pointer">
													Composite
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem
													value={ItemType.NON_INVENTORY}
													id="non-inventory"
												/>
												<Label
													htmlFor="non-inventory"
													className="font-normal cursor-pointer">
													Non-Inventory
												</Label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator />

					{/* Basic Item Details */}
					<div className="space-y-4">
						<h3 className="text-base font-semibold">Basic Item Details</h3>
						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Item Code</FormLabel>
										<FormControl>
											<Input
												placeholder="Auto-generated if left empty"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Leave empty to auto-generate (e.g., ITM-00001)
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Name <span className="text-destructive">*</span>
										</FormLabel>
										<FormControl>
											<Input placeholder="Enter item name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="unit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Unit</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value || ""}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select unit" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="nos">Nos</SelectItem>
													<SelectItem value="kg">Kg</SelectItem>
													<SelectItem value="g">G</SelectItem>
													<SelectItem value="ltr">Ltr</SelectItem>
													<SelectItem value="ml">Ml</SelectItem>
													<SelectItem value="mtr">Mtr</SelectItem>
													<SelectItem value="box">Box</SelectItem>
													<SelectItem value="hour">Hour</SelectItem>
													<SelectItem value="day">Day</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="hsnSacCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>HSN Code</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														placeholder="Search HSN code"
														{...field}
														onChange={(e) => {
															field.onChange(e);
															setHsnQuery(e.target.value);
														}}
													/>
													<Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
												</div>
											</FormControl>
											{hsnSuggestions?.data &&
												hsnSuggestions.data.length > 0 && (
													<div className="mt-2 space-y-1 border rounded-md p-2 max-h-40 overflow-y-auto">
														{hsnSuggestions.data.map((suggestion) => (
															<Button
																key={suggestion.code}
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => {
																	form.setValue("hsnSacCode", suggestion.code);
																	setHsnQuery("");
																}}
																className="w-full justify-start text-left h-auto py-2">
																<div className="text-left">
																	<div className="font-medium">
																		{suggestion.code}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		{suggestion.description}
																	</div>
																</div>
															</Button>
														))}
													</div>
												)}
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="barcode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Barcode</FormLabel>
										<FormControl>
											<Input placeholder="Enter barcode" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isTaxable"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Is Taxable</FormLabel>
										</div>
									</FormItem>
								)}
							/>
							{isTaxable && (
								<>
									<FormField
										control={form.control}
										name="taxPreference"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Tax Preference{" "}
													<span className="text-destructive">*</span>
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value || TaxPreference.TAXABLE}>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select tax preference" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={TaxPreference.TAXABLE}>
															Taxable
														</SelectItem>
														<SelectItem value={TaxPreference.EXEMPT}>
															Exempt
														</SelectItem>
														<SelectItem value={TaxPreference.ZERO_RATED}>
															Zero Rated
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}
						</div>
					</div>

					<Separator />

					{/* Sales Information */}
					<div className="space-y-4">
						<h3 className="text-base font-semibold">Sales Information</h3>
						<FormField
							control={form.control}
							name="sellable"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Sellable</FormLabel>
									</div>
								</FormItem>
							)}
						/>
						{sellable && (
							<div className="space-y-4 pl-7">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="sellingPrice"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Selling Price{" "}
													<span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(e.target.value)
																	: undefined
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* <div className="flex items-end pb-2">
										<Select defaultValue="INR">
											<SelectTrigger className="w-20">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="INR">INR</SelectItem>
											</SelectContent>
										</Select>
									</div> */}
									<FormField
										control={form.control}
										name="salesAccountId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Sales Account{" "}
													<span className="text-destructive">*</span>
												</FormLabel>
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														setSalesAccountSearch("");
													}}
													value={field.value || "none"}>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select sales account" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<div
															key="sales-search-input"
															className="p-2 border-b">
															<div className="relative">
																<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Search account"
																	value={salesAccountSearch}
																	onChange={(e) => {
																		e.stopPropagation();
																		setSalesAccountSearch(e.target.value);
																	}}
																	onClick={(e) => e.stopPropagation()}
																	className="pl-8"
																/>
															</div>
														</div>
														<div
															key="sales-search-results"
															className="max-h-[300px] overflow-y-auto">
															{salesAccountsData?.data?.docs &&
															salesAccountsData.data.docs.length > 0 ? (
																salesAccountsData.data.docs.map((account) => (
																	<SelectItem
																		key={account._id}
																		value={account._id}
																		className="pl-4">
																		<div className="flex items-center gap-2">
																			<span className="font-mono text-xs text-muted-foreground">
																				{account.code}
																			</span>
																			<span>{account.name}</span>
																		</div>
																	</SelectItem>
																))
															) : (
																<div
																	key="sales-no-results"
																	className="px-2 py-1.5 text-sm text-muted-foreground text-center">
																	{salesAccountSearch.length > 0
																		? "No accounts found"
																		: "Start typing to search"}
																</div>
															)}
														</div>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="salesDescription"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Enter description"
													className="resize-none"
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
					</div>

					<Separator />

					{/* Purchase Information */}
					<div className="space-y-4">
						<h3 className="text-base font-semibold">Purchase Information</h3>
						<FormField
							control={form.control}
							name="purchasable"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Purchasable</FormLabel>
									</div>
								</FormItem>
							)}
						/>
						{purchasable && (
							<div className="space-y-4 pl-7">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="costPrice"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Cost Price <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(e.target.value)
																	: undefined
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* <div className="flex items-end pb-2">
										<Select defaultValue="INR">
											<SelectTrigger className="w-20">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="INR">INR</SelectItem>
											</SelectContent>
										</Select>
									</div> */}
									<FormField
										control={form.control}
										name="purchaseAccountId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Purchase Account{" "}
													<span className="text-destructive">*</span>
												</FormLabel>
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														setPurchaseAccountSearch("");
													}}
													value={field.value || "none"}>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select purchase account" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<div
															key="purchase-search-input"
															className="p-2 border-b">
															<div className="relative">
																<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Search account"
																	value={purchaseAccountSearch}
																	onChange={(e) => {
																		e.stopPropagation();
																		setPurchaseAccountSearch(e.target.value);
																	}}
																	onClick={(e) => e.stopPropagation()}
																	className="pl-8"
																/>
															</div>
														</div>
														<div
															key="purchase-search-results"
															className="max-h-[300px] overflow-y-auto">
															{purchaseAccountsData?.data?.docs &&
															purchaseAccountsData.data.docs.length > 0 ? (
																purchaseAccountsData.data.docs.map(
																	(account) => (
																		<SelectItem
																			key={account._id}
																			value={account._id}
																			className="pl-4">
																			<div className="flex items-center gap-2">
																				<span className="font-mono text-xs text-muted-foreground">
																					{account.code}
																				</span>
																				<span>{account.name}</span>
																			</div>
																		</SelectItem>
																	)
																)
															) : (
																<div
																	key="purchase-no-results"
																	className="px-2 py-1.5 text-sm text-muted-foreground text-center">
																	{purchaseAccountSearch.length > 0
																		? "No accounts found"
																		: "Start typing to search"}
																</div>
															)}
														</div>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="purchaseDescription"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Enter description"
													className="resize-none"
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="preferredVendorId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Preferred Vendor</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value === "none" ? "" : value);
													setVendorSearch("");
												}}
												value={field.value || "none"}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select vendor" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<div
														key="vendor-search-input"
														className="p-2 border-b">
														<div className="relative">
															<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
															<Input
																placeholder="Search vendor"
																value={vendorSearch}
																onChange={(e) => {
																	e.stopPropagation();
																	setVendorSearch(e.target.value);
																}}
																onClick={(e) => e.stopPropagation()}
																className="pl-8"
															/>
														</div>
													</div>
													<div
														key="vendor-search-results"
														className="max-h-[300px] overflow-y-auto">
														<SelectItem key="vendor-none" value="none">
															None
														</SelectItem>
														{vendorsData?.data?.docs &&
														vendorsData.data.docs.length > 0 ? (
															vendorsData.data.docs.map((vendor) => (
																<SelectItem
																	key={vendor._id || ""}
																	value={vendor._id || ""}
																	className="pl-4">
																	{vendor.name}
																</SelectItem>
															))
														) : debouncedVendorSearch.length > 0 ? (
															<div
																key="no-vendors"
																className="px-2 py-1.5 text-sm text-muted-foreground text-center">
																No vendors found
															</div>
														) : null}
													</div>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
					</div>

					<Separator />

					{/* Default Tax Rates */}
					{isTaxable && (
						<div className="space-y-4">
							<h3 className="text-base font-semibold">Default Tax Rates</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="intraStateTaxRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Intra State Tax Rate (%)</FormLabel>
											<Select
												onValueChange={(value) =>
													field.onChange(value ? Number(value) : undefined)
												}
												value={field.value?.toString() || ""}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select tax rate" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="5">
														5% (2.5% CGST + 2.5% SGST)
													</SelectItem>
													<SelectItem value="12">
														12% (6% CGST + 6% SGST)
													</SelectItem>
													<SelectItem value="18">
														18% (9% CGST + 9% SGST)
													</SelectItem>
													<SelectItem value="28">
														28% (14% CGST + 14% SGST)
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="interStateTaxRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Inter State Tax Rate (%)</FormLabel>
											<Select
												onValueChange={(value) =>
													field.onChange(value ? Number(value) : undefined)
												}
												value={field.value?.toString() || ""}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select tax rate" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="5">5% IGST</SelectItem>
													<SelectItem value="12">12% IGST</SelectItem>
													<SelectItem value="18">18% IGST</SelectItem>
													<SelectItem value="28">28% IGST</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					)}

					<Separator />

					{/* Inventory Tracking */}
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="trackInventory"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Track Inventory for this item</FormLabel>
										<FormDescription className="text-sm text-muted-foreground">
											You cannot enable/disable inventory tracking once
											you&apos;ve created transactions for this item.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						{trackInventory && (
							<div className="space-y-4 pl-7">
								<FormField
									control={form.control}
									name="inventoryAccountId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Inventory Account{" "}
												<span className="text-destructive">*</span>
											</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													setInventoryAccountSearch("");
												}}
												value={field.value || "none"}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select inventory account" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<div
														key="inventory-search-input"
														className="p-2 border-b">
														<div className="relative">
															<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
															<Input
																placeholder="Search account"
																value={inventoryAccountSearch}
																onChange={(e) => {
																	e.stopPropagation();
																	setInventoryAccountSearch(e.target.value);
																}}
																onClick={(e) => e.stopPropagation()}
																className="pl-8"
															/>
														</div>
													</div>
													<div
														key="inventory-search-results"
														className="max-h-[300px] overflow-y-auto">
														{inventoryAccountsData?.data?.docs &&
														inventoryAccountsData.data.docs.length > 0 ? (
															inventoryAccountsData.data.docs.map((account) => (
																<SelectItem
																	key={account._id}
																	value={account._id}
																	className="pl-4">
																	<div className="flex items-center gap-2">
																		<span className="font-mono text-xs text-muted-foreground">
																			{account.code}
																		</span>
																		<span>{account.name}</span>
																	</div>
																</SelectItem>
															))
														) : (
															<div
																key="inventory-no-results"
																className="px-2 py-1.5 text-sm text-muted-foreground text-center">
																{inventoryAccountSearch.length > 0
																	? "No accounts found"
																	: "Start typing to search"}
															</div>
														)}
													</div>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="openingStock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Opening Stock</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0"
														{...field}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(e.target.value)
																	: undefined
															)
														}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="openingStockRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Opening Stock Rate</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0.00"
														{...field}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(e.target.value)
																	: undefined
															)
														}
														value={field.value || ""}
													/>
												</FormControl>
												<FormDescription>
													Required if opening stock is provided
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="lowStockAlert"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Low Stock Alert</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0"
														{...field}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(e.target.value)
																	: undefined
															)
														}
														value={field.value || ""}
													/>
												</FormControl>
												<FormDescription>
													Alert when stock falls below this level
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-4 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/items")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

export default UpdateItemForm;
