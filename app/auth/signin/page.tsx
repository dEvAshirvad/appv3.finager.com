import React from "react";
import SigninForm from "./form";

function SigninPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold">Sign in to your account</h1>
				<p className="text-muted-foreground text-sm text-balance">
					Enter your email below to sign in to your account
				</p>
			</div>
			<SigninForm />
		</div>
	);
}

export default SigninPage;
