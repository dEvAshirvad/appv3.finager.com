"use client";

import React, { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
	useUpdateContact,
	useContact,
	ContactType,
} from "@/queries/contacts";

const addressSchema = z.object({
	street: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	pincode: z.string().optional(),
	country: z.string().optional(),
});

const formSchema = z.object({
	type: z.nativeEnum(ContactType),
	name: z.string().min(2, "Name must be at least 2 characters"),
	companyName: z.string().optional(),
	gstin: z.string().optional(),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
	phone: z.string().optional(),
	billingAddress: addressSchema.optional(),
	shippingAddress: addressSchema.optional(),
	openingBalance: z.number().optional(),
	openingBalanceType: z.enum(["debit", "credit"]).optional(),
	paymentTerms: z
		.number()
		.positive("Payment terms must be positive")
		.optional(),
	creditLimit: z
		.number()
		.nonnegative("Credit limit must be non-negative")
		.optional(),
	useSameAddress: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function UpdateSupplierForm({
	contactId,
	className,
	...props
}: {
	contactId: string;
} & React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: updateContact, isPending } = useUpdateContact();
	const { data: contactData, isLoading: isLoadingContact } = useContact(contactId);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: ContactType.VENDOR,
			name: "",
			companyName: "",
			gstin: "",
			email: "",
			phone: "",
			billingAddress: {
				street: "",
				city: "",
				state: "",
				pincode: "",
				country: "India",
			},
			shippingAddress: {
				street: "",
				city: "",
				state: "",
				pincode: "",
				country: "India",
			},
			openingBalance: undefined,
			openingBalanceType: "credit",
			paymentTerms: undefined,
			creditLimit: undefined,
			useSameAddress: false,
		},
	});

	// Update form when contact data loads
	useEffect(() => {
		if (contactData?.data) {
			const contact = contactData.data;
			form.reset({
				type: contact.type,
				name: contact.name,
				companyName: contact.companyName || "",
				gstin: contact.gstin || "",
				email: contact.email || "",
				phone: contact.phone || "",
				billingAddress: contact.billingAddress || {
					street: "",
					city: "",
					state: "",
					pincode: "",
					country: "India",
				},
				shippingAddress: contact.shippingAddress || {
					street: "",
					city: "",
					state: "",
					pincode: "",
					country: "India",
				},
				openingBalance: contact.openingBalance,
				openingBalanceType: contact.openingBalanceType || "credit",
				paymentTerms: contact.paymentTerms,
				creditLimit: contact.creditLimit,
				useSameAddress: false,
			});
		}
	}, [contactData?.data, form]);

	const useSameAddress = form.watch("useSameAddress");
	const billingAddress = form.watch("billingAddress");

	// Sync shipping address with billing address when checkbox is checked
	React.useEffect(() => {
		if (useSameAddress && billingAddress) {
			form.setValue("shippingAddress", billingAddress);
		}
	}, [useSameAddress, billingAddress, form]);

	async function onSubmit(values: FormValues) {
		const payload: any = {};

		if (values.type !== contactData?.data?.type) payload.type = values.type;
		if (values.name !== contactData?.data?.name) payload.name = values.name;
		if (values.companyName !== contactData?.data?.companyName)
			payload.companyName = values.companyName || undefined;
		if (values.gstin !== contactData?.data?.gstin)
			payload.gstin = values.gstin || undefined;
		if (values.email !== contactData?.data?.email)
			payload.email = values.email || undefined;
		if (values.phone !== contactData?.data?.phone)
			payload.phone = values.phone || undefined;

		// Addresses - only send if changed
		if (values.billingAddress) {
			payload.billingAddress = {
				...values.billingAddress,
				country: values.billingAddress.country || "India",
			};
		}
		if (values.shippingAddress) {
			payload.shippingAddress = {
				...values.shippingAddress,
				country: values.shippingAddress.country || "India",
			};
		}

		// Financial fields
		if (values.openingBalance !== contactData?.data?.openingBalance) {
			payload.openingBalance = values.openingBalance;
			payload.openingBalanceType = values.openingBalanceType || "credit";
		}
		if (values.paymentTerms !== contactData?.data?.paymentTerms)
			payload.paymentTerms = values.paymentTerms;
		if (values.creditLimit !== contactData?.data?.creditLimit)
			payload.creditLimit = values.creditLimit;

		updateContact(
			{
				id: contactId,
				data: payload,
			},
			{
				onSuccess: () => {
					router.push("/purchases/suppliers");
				},
			}
		);
	}

	if (isLoadingContact) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);
	}

	if (!contactData?.data) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Contact not found</p>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className={cn("space-y-6", className)}
					{...props}>
					{/* Basic Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Contact Information</h3>
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Contact Type <span className="text-destructive">*</span>
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select contact type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={ContactType.CUSTOMER}>Customer</SelectItem>
											<SelectItem value={ContactType.VENDOR}>Vendor</SelectItem>
											<SelectItem value={ContactType.BOTH}>Both</SelectItem>
										</SelectContent>
									</Select>
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
										<Input placeholder="John Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="companyName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Company Name</FormLabel>
									<FormControl>
										<Input placeholder="ABC Company Pvt Ltd" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="john@example.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone</FormLabel>
										<FormControl>
											<Input placeholder="+919876543210" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="gstin"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GSTIN</FormLabel>
									<FormControl>
										<Input
											placeholder="22AABCU9603R1Z1"
											maxLength={15}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										15-character GSTIN (optional for unregistered businesses)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Billing Address */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Billing Address</h3>
						<FormField
							control={form.control}
							name="billingAddress.street"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Street</FormLabel>
									<FormControl>
										<Input placeholder="MG Road" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="billingAddress.city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>City</FormLabel>
										<FormControl>
											<Input placeholder="Raipur" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="billingAddress.state"
								render={({ field }) => (
									<FormItem>
										<FormLabel>State</FormLabel>
										<FormControl>
											<Input placeholder="Chhattisgarh" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="billingAddress.pincode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Pincode</FormLabel>
										<FormControl>
											<Input placeholder="492001" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="billingAddress.country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input placeholder="India" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Shipping Address */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Shipping Address</h3>
							<FormField
								control={form.control}
								name="useSameAddress"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="font-normal">
											Same as billing address
										</FormLabel>
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="shippingAddress.street"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Street</FormLabel>
									<FormControl>
										<Input
											placeholder="MG Road"
											{...field}
											disabled={useSameAddress}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="shippingAddress.city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>City</FormLabel>
										<FormControl>
											<Input
												placeholder="Raipur"
												{...field}
												disabled={useSameAddress}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="shippingAddress.state"
								render={({ field }) => (
									<FormItem>
										<FormLabel>State</FormLabel>
										<FormControl>
											<Input
												placeholder="Chhattisgarh"
												{...field}
												disabled={useSameAddress}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="shippingAddress.pincode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Pincode</FormLabel>
										<FormControl>
											<Input
												placeholder="492001"
												{...field}
												disabled={useSameAddress}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="shippingAddress.country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input
												placeholder="India"
												{...field}
												disabled={useSameAddress}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Financial Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Financial Information</h3>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="openingBalance"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Opening Balance</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="0"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value === ""
															? undefined
															: parseFloat(e.target.value)
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
								name="openingBalanceType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Balance Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || "credit"}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="debit">
													Debit (Supplier owes you)
												</SelectItem>
												<SelectItem value="credit">
													Credit (You owe supplier)
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="paymentTerms"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payment Terms (days)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="15"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value === ""
															? undefined
															: parseInt(e.target.value)
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
								name="creditLimit"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Credit Limit (₹)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="0"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value === ""
															? undefined
															: parseFloat(e.target.value)
													)
												}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-4 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/purchases/suppliers")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								"Update Supplier"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

export default UpdateSupplierForm;

