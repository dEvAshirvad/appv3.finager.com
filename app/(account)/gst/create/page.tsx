"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import DashTitle from "@/components/header/dash-title";
import { useCreateGST } from "@/queries/gst";
import { useSession } from "@/queries/auth";

const formSchema = z.object({
	gstin: z
		.string()
		.min(15, "GSTIN must be 15 characters")
		.max(15, "GSTIN must be 15 characters")
		.regex(
			/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
			"Invalid GSTIN format"
		),
	email: z.string().email("Invalid email address"),
	stateCd: z.string().length(2, "State code must be 2 digits"),
	ipAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateGSTPage() {
	const router = useRouter();
	const { data: sessionData } = useSession();
	const { mutate: createGST, isPending } = useCreateGST();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			gstin: "",
			email: "",
			stateCd: "",
			ipAddress: "",
		},
	});

	async function onSubmit(values: FormValues) {
		createGST(
			{
				organizationId: sessionData?.session?.activeOrganizationId || "",
				gstin: values.gstin.toUpperCase(),
				email: values.email,
				stateCd: values.stateCd,
				ipAddress: values.ipAddress || undefined,
			},
			{
				onSuccess: (response) => {
					// Redirect to details page after creation
					router.push(`/account/gst/${response.data.id}`);
				},
			}
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<DashTitle title="Add GST Credentials" />
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="gstin"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									GSTIN <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="22AAAAA0000A1Z5"
										className="font-mono uppercase"
										maxLength={15}
										onChange={(e) => {
											field.onChange(e.target.value.toUpperCase());
										}}
									/>
								</FormControl>
								<FormDescription>
									15-character GSTIN (e.g., 22AAAAA0000A1Z5)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Email <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										type="email"
										placeholder="ashirvad@finager.in"
									/>
								</FormControl>
								<FormDescription>
									Email address registered with GST portal
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="stateCd"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									State Code <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="22"
										maxLength={2}
										onChange={(e) => {
											field.onChange(e.target.value.replace(/\D/g, ""));
										}}
									/>
								</FormControl>
								<FormDescription>
									2-digit state code (e.g., 22 for Chhattisgarh)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="ipAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>IP Address</FormLabel>
								<FormControl>
									<Input {...field} placeholder="192.168.1.1" />
								</FormControl>
								<FormDescription>
									Optional IP address for authentication
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex justify-end gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/account/gst")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
