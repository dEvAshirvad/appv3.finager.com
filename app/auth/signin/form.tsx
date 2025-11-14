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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
// import { useEmailSignIn, useSocialSignInGoogle } from "@/queries/auth";
import { redirect } from "next/navigation";

const formSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

function SigninForm({ className, ...props }: React.ComponentProps<"form">) {
	// const { isPending } = useEmailSignIn();
	// const { mutate: socialSignIn, isPending: isSocialSignInPending } =
	// 	useSocialSignInGoogle();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);
		redirect("/dashboard");
		// signIn({
		// 	email: values.email,
		// 	password: values.password,
		// 	form,
		// });
	}
	return (
		<div className="space-y-6">
			<div className="space-y-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className={cn("space-y-6", className)}
						{...props}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="m@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center">
										<FormLabel>Password</FormLabel>
										<Link
											href="/forgot-password"
											className="ml-auto text-sm underline-offset-4 hover:underline">
											Forgot your password?
										</Link>
									</div>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							type="submit"
							className="w-full"
							// disabled={isPending || !form.formState.isValid}
						>
							{/* {isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								"Sign in"
							)} */}
							Sign in
						</Button>
					</form>
				</Form>
				<div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
					<span className="bg-background text-muted-foreground relative z-10 px-2">
						Or continue with
					</span>
				</div>
				<Button
					variant="outline"
					className="w-full"
					// disabled={isSocialSignInPending}
					// onClick={() => socialSignIn()}>
					// {isSocialSignInPending ? (
					// 	<Loader2 className="size-4 animate-spin" />
					// ) : (
					// 	<>
					// 		<Image
					// 			src="/icons8-google.svg"
					// 			alt="Google"
					// 			width={20}
					// 			height={20}
					// 			/>
				>
					Sign in with Google
				</Button>
			</div>
			<div className="text-sm">
				Don&apos;t have an account?{" "}
				<Link href="/auth/signup" className="underline underline-offset-4">
					Sign up
				</Link>
			</div>
		</div>
	);
}

export default SigninForm;
