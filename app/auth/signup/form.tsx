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
import { useEmailSignUp, useSocialSignInGoogle } from "@/queries/auth";

const formSchema = z.object({
	// name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
	const { mutate: signUp, isPending } = useEmailSignUp();
	const { mutate: socialSignInGoogle, isPending: isSocialPending } =
		useSocialSignInGoogle();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		signUp({
			email: values.email,
			password: values.password,
			name: values.email.split("@")[0], // Use email prefix as default name
			form,
		});
	}

	return (
		<div className="space-y-6">
			<div className="space-y-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className={cn("space-y-6", className)}
						{...props}>
						{/* <FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input placeholder="John Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/> */}
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
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="••••••••" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							type="submit"
							className="w-full"
							disabled={isPending || !form.formState.isValid}>
							{isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								"Create Account"
							)}
						</Button>
					</form>
				</Form>
				<div className="text-muted-foreground *:[a]:hover:text-primary text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
					By clicking continue, you agree to our{" "}
					<a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
				</div>
				<div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
					<span className="bg-background text-muted-foreground relative z-10 px-2">
						Or continue with
					</span>
				</div>
				<Button
					variant="outline"
					className="w-full"
					disabled={isSocialPending}
					onClick={() => socialSignInGoogle()}>
					{isSocialPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<>
							<Image
								src="/icons8-google.svg"
								alt="Google"
								width={20}
								height={20}
							/>
						</>
					)}
					Sign up with Google
				</Button>
			</div>
			<div className="text-sm">
				Already have an account?{" "}
				<Link href="/auth/signin" className="underline underline-offset-4">
					Sign in
				</Link>
			</div>
		</div>
	);
}

export default SignupForm;
