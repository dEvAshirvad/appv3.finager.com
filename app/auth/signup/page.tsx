import React from "react";
import SignupForm from "./form";

function SignupPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold">Create your account</h1>
				<p className="text-muted-foreground text-sm text-balance">
					Enter your details below to create your account
				</p>
			</div>
			<SignupForm />
		</div>
	);
}

export default SignupPage;
