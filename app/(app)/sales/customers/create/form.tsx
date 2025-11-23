"use client";

import React from "react";
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
import { useCreateContact, ContactType } from "@/queries/contacts";
import { useSession } from "@/queries/auth";

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

function CreateCustomerForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: createContact, isPending } = useCreateContact();
	const { data: sessionData } = useSession();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: ContactType.CUSTOMER,
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
			openingBalanceType: "debit",
			paymentTerms: undefined,
			creditLimit: undefined,
			useSameAddress: false,
		},
	});

	const useSameAddress = form.watch("useSameAddress");
	const billingAddress = form.watch("billingAddress");

	// Sync shipping address with billing address when checkbox is checked
	React.useEffect(() => {
		if (useSameAddress && billingAddress) {
			form.setValue("shippingAddress", billingAddress);
		}
	}, [useSameAddress, billingAddress, form]);

	async function onSubmit(values: FormValues) {
		const payload: any = {
			type: values.type,
			name: values.name,
			organizationId: sessionData?.session?.activeOrganizationId,
		};

		if (values.companyName) payload.companyName = values.companyName;
		if (values.gstin) payload.gstin = values.gstin;
		if (values.email) payload.email = values.email;
		if (values.phone) payload.phone = values.phone;

		// Addresses
		if (
			values.billingAddress &&
			Object.values(values.billingAddress).some(Boolean)
		) {
			payload.billingAddress = {
				...values.billingAddress,
				country: values.billingAddress.country || "India",
			};
		}
		if (
			values.shippingAddress &&
			Object.values(values.shippingAddress).some(Boolean)
		) {
			payload.shippingAddress = {
				...values.shippingAddress,
				country: values.shippingAddress.country || "India",
			};
		}

		// Financial fields
		if (values.openingBalance !== undefined) {
			payload.openingBalance = values.openingBalance;
			payload.openingBalanceType = values.openingBalanceType || "debit";
		}
		if (values.paymentTerms !== undefined)
			payload.paymentTerms = values.paymentTerms;
		if (values.creditLimit !== undefined)
			payload.creditLimit = values.creditLimit;

		createContact(payload, {
			onSuccess: () => {
				router.push("/sales/customers");
			},
		});
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
											value={field.value || "debit"}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="debit">
													Debit (Customer owes you)
												</SelectItem>
												<SelectItem value="credit">
													Credit (You owe vendor)
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
							onClick={() => router.push("/sales/customers")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Contact"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

export default CreateCustomerForm;
