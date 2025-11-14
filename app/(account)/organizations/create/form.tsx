"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { useCreateOrganization } from "@/queries/organization";

const formSchema = z
	.object({
		organizationName: z
			.string()
			.min(2, "Organization name must be at least 2 characters"),
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

function OnboardingForm({ className, ...props }: React.ComponentProps<"form">) {
	const { mutate: createOrganization } = useCreateOrganization();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			organizationName: "",
			isGstregisterd: false,
			gstin: "",
			industry: "",
		},
	});

	const isGstRegistered = form.watch("isGstregisterd");

	async function onSubmit(values: FormValues) {
		if (!values.isGstregisterd) {
			values.gstin = "";
		}

		// Create organization first
		createOrganization({
			name: values.organizationName,
			slug: values.organizationName.toLowerCase().replace(/ /g, "-"),
			type: "company",
			isGstRegistered: values.isGstregisterd,
			gstin: values.gstin || "",
			industry: values.industry,
			form,
		});
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
						name="organizationName"
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
						render={({ field }) => (
							<FormItem>
								<FormLabel>Industry</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select your industry" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="retail">Retail</SelectItem>
											<SelectItem value="wholesale">Wholesale</SelectItem>
											<SelectItem value="manufacturing">
												Manufacturing
											</SelectItem>
											<SelectItem value="service">Service</SelectItem>
											<SelectItem value="education">Education</SelectItem>
											<SelectItem value="healthcare">Healthcare</SelectItem>
											<SelectItem value="finance">Finance</SelectItem>
											<SelectItem value="insurance">Insurance</SelectItem>
											<SelectItem value="real estate">Real Estate</SelectItem>
											<SelectItem value="transportation">
												Transportation
											</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full">
						Create Organization
					</Button>
				</form>
			</Form>
		</div>
	);
}

export default OnboardingForm;
