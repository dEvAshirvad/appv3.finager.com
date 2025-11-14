"use client";

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
import { useSession } from "@/queries/auth";
import { useCreateOrganization } from "@/queries/organization";
import { useUpdateUser } from "@/queries/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
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
	const { data, isFetched, isLoading } = useSession();
	const { mutate: createOrganization } = useCreateOrganization();
	const { mutate: updateUser } = useUpdateUser();
	const router = useRouter();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: data?.user?.name || "",
			organizationName: "",
			isGstregisterd: false,
			gstin: "",
			industry: "",
		},
	});

	const isGstRegistered = form.watch("isGstregisterd");

	function onSubmit(values: FormValues) {
		if (!values.isGstregisterd) {
			values.gstin = "";
		}
		console.log(values);
		createOrganization({
			name: values.organizationName,
			slug: values.organizationName.toLowerCase().replace(/ /g, "-"),
			isGstRegistered: values.isGstregisterd,
			gstin: values.gstin || "",
			industry: values.industry,
			type: "company",
			form,
		});
		updateUser({
			name: values.name,
		});
		toast.success("Onboarding completed successfully!");
		setTimeout(() => {
			router.push("/dashboard");
		}, 1000);
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
								<FormLabel>Full Name</FormLabel>
								<FormControl>
									<Input placeholder="ASB LTD" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
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
											<SelectItem value="industry1">Industry 1</SelectItem>
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full">
						Complete Onboarding
					</Button>
				</form>
			</Form>
		</div>
	);
}

export default OnboardingForm;
