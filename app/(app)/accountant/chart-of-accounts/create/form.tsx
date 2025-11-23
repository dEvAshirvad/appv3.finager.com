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
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateCOA,
	AccountType,
	AccountStatus,
	useCOAList,
} from "@/queries/chart-of-accounts";
import { useSession } from "@/queries/auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";

const formSchema = z.object({
	name: z.string().min(2, "Account name must be at least 2 characters"),
	description: z.string().optional(),
	type: z.nativeEnum(AccountType),
	code: z.string().min(1, "Account code is required"),
	parentCode: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function CreateAccountForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const router = useRouter();
	const { mutate: createAccount, isPending } = useCreateCOA();
	const { data: sessionData } = useSession();
	const [parentSearchQuery, setParentSearchQuery] = React.useState("");
	const debouncedSearchQuery = useDebounce(parentSearchQuery, 300);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			type: AccountType.ASSET,
			code: "",
			parentCode: null,
		},
	});

	const accountType = form.watch("type");

	// Use list API with search for parent account selection
	// Only call API when there's a debounced search query (debounced by 300ms)
	const shouldFetch = debouncedSearchQuery.length > 0;
	const { data: parentAccountsData, isLoading: isLoadingParents } = useCOAList(
		shouldFetch
			? {
					organizationId: sessionData?.session?.activeOrganizationId,
					page: 1,
					limit: 50,
					search: debouncedSearchQuery,
			  }
			: undefined
	);

	// Display all accounts returned by API (API already filters by search)
	// Note: We don't filter by type here since parent can be any account type
	const displayAccounts = React.useMemo(() => {
		if (!parentAccountsData?.data?.docs) return [];
		return parentAccountsData.data.docs;
	}, [parentAccountsData?.data?.docs]);

	async function onSubmit(values: FormValues) {
		createAccount(
			{
				organizationId: sessionData?.session?.activeOrganizationId,
				name: values.name,
				description: values.description || undefined,
				type: values.type,
				code: values.code,
				parentCode: values.parentCode || null,
			},
			{
				onSuccess: () => {
					router.push("/accountant/chart-of-accounts");
				},
			}
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
						<h3 className="text-lg font-semibold">Account Information</h3>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Account Name <span className="text-destructive">*</span>
									</FormLabel>
									<FormControl>
										<Input placeholder="Cash and Cash Equivalents" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Enter account description"
											className="resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Account Type <span className="text-destructive">*</span>
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select account type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={AccountType.ASSET}>Asset</SelectItem>
												<SelectItem value={AccountType.LIABILITY}>
													Liability
												</SelectItem>
												<SelectItem value={AccountType.EQUITY}>
													Equity
												</SelectItem>
												<SelectItem value={AccountType.INCOME}>
													Income
												</SelectItem>
												<SelectItem value={AccountType.EXPENSE}>
													Expense
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Account Code <span className="text-destructive">*</span>
										</FormLabel>
										<FormControl>
											<Input placeholder="1100" {...field} />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="parentCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Parent Account</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value === "none" ? null : value);
											setParentSearchQuery(""); // Clear search after selection
										}}
										value={field.value || "none"}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select parent account (optional)" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<div className="p-2 border-b">
												<div className="relative">
													<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
													<Input
														placeholder="Search"
														value={parentSearchQuery}
														onChange={(e) => {
															e.stopPropagation();
															setParentSearchQuery(e.target.value);
														}}
														onClick={(e) => e.stopPropagation()}
														className="pl-8"
													/>
												</div>
											</div>
											<div className="max-h-[300px] overflow-y-auto">
												<SelectItem value="none">
													None (Root Account)
												</SelectItem>
												{isLoadingParents ? (
													<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
														<Loader2 className="h-4 w-4 animate-spin mx-auto" />
													</div>
												) : displayAccounts.length > 0 ? (
													displayAccounts.map((account) => (
														<SelectItem
															key={account._id}
															value={account.code}
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
													<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
														No accounts found
													</div>
												)}
											</div>
										</SelectContent>
									</Select>
									<FormDescription>
										Select a parent account to create a hierarchical structure
									</FormDescription>
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
							onClick={() => router.push("/accountant/chart-of-accounts")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Account"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

export default CreateAccountForm;
