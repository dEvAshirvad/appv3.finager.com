"use client";

import React, { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
import {
	useUpdateOrganization,
	useFullOrganization,
} from "@/queries/organization";

const formSchema = z
	.object({
		name: z.string().min(2, "Organization name must be at least 2 characters"),
		slug: z
			.string()
			.min(2, "Slug must be at least 2 characters")
			.regex(
				/^[a-z0-9-]+$/,
				"Slug can only contain lowercase letters, numbers, and hyphens"
			),
		isGstregisterd: z.boolean(),
		gstin: z.string().optional(),
		industry: z.string().min(2, "Industry must be at least 2 characters"),
	})
	.refine(
		(data) => {
			if (data.isGstregisterd) {
				return data.gstin && data.gstin.length > 0;
			}
			return true;
		},
		{
			message: "GSTIN is required when GST registered is checked",
			path: ["gstin"],
		}
	);

type FormValues = z.infer<typeof formSchema>;

function OrganizationForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const { data: organization, isLoading: isLoadingOrg } = useFullOrganization();
	const { mutate: updateOrganization, isPending } = useUpdateOrganization();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: organization?.name || "",
			slug: organization?.slug || "",
			isGstregisterd: false,
			gstin: organization?.gstin || "",
			industry: organization?.industry || "",
		},
	});

	// Update form when organization data loads
	useEffect(() => {
		if (organization) {
			form.reset({
				name: organization.name || "",
				slug: organization.slug || "",
				isGstregisterd: false,
				gstin: organization?.gstin || "",
				industry: organization?.industry || "",
			});
		}
	}, [organization, form]);

	const isGstRegistered = form.watch("isGstregisterd");

	function onSubmit(values: FormValues) {
		if (!organization?.id) {
			return;
		}

		if (!values.isGstregisterd) {
			values.gstin = "";
		}

		updateOrganization({
			organizationId: organization.id,
			data: {
				name: values.name,
				slug: values.slug,
				type: "company", // Default type, adjust if needed
			},
			form,
		});
	}

	if (isLoadingOrg) {
		return (
			<div className="flex items-center justify-center p-6">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (!organization) {
		return (
			<div className="p-6 text-center text-muted-foreground">
				No organization found. Please create an organization first.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className={cn("space-y-6", className)}
					{...props}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Organization Name</FormLabel>
								<FormControl>
									<Input placeholder="ASB LTD" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="slug"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Slug</FormLabel>
								<FormControl>
									<Input placeholder="asb-ltd" {...field} />
								</FormControl>
								<FormDescription>
									Lowercase letters, numbers, and hyphens only
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="isGstregisterd"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>GST Registered</FormLabel>
									<FormDescription>
										Check if your organization is GST registered
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>
					{isGstRegistered && (
						<FormField
							control={form.control}
							name="gstin"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GSTIN</FormLabel>
									<FormControl>
										<Input placeholder="Enter GSTIN" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
					<FormField
						control={form.control}
						name="industry"
						render={({ field }) => {
							const currentValue = field.value || organization?.industry || "";
							const industryOptions = [
								{ value: "industry1", label: "Industry 1" },
								// Add more industry options here as needed
							];

							// Include current value as option if it's not in the list
							const hasCurrentValue = industryOptions.some(
								(opt) => opt.value === currentValue
							);
							if (currentValue && !hasCurrentValue) {
								industryOptions.unshift({
									value: currentValue,
									label: currentValue,
								});
							}

							return (
								<FormItem>
									<FormLabel>Industry</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											value={currentValue || undefined}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select your industry" />
											</SelectTrigger>
											<SelectContent>
												{industryOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Updating...
							</>
						) : (
							"Update Organization"
						)}
					</Button>
				</form>
			</Form>
		</div>
	);
}

export default OrganizationForm;
