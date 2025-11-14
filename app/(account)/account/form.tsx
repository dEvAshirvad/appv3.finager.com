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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateUser } from "@/queries/auth";
import { useSession } from "@/queries/auth";

const formSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormValues = z.infer<typeof formSchema>;

function AccountForm({ className, ...props }: React.ComponentProps<"form">) {
	const { data: sessionData, isLoading: isLoadingSession } = useSession();
	const { mutate: updateUser, isPending } = useUpdateUser();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: sessionData?.user?.name || "",
		},
	});

	// Update form when user data loads
	useEffect(() => {
		if (sessionData?.user?.name) {
			form.reset({
				name: sessionData.user.name,
			});
		}
	}, [sessionData?.user?.name, form]);

	function onSubmit(values: FormValues) {
		updateUser({
			name: values.name,
			form,
		});
	}

	if (isLoadingSession) {
		return (
			<div className="flex items-center justify-center p-6">
				<Loader2 className="h-6 w-6 animate-spin" />
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
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Enter your name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</form>
			</Form>
		</div>
	);
}

export default AccountForm;
