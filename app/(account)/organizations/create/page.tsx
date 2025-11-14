import React from "react";
import OnboardingForm from "./form";

function CreateOrganizationPage({
	className,
	...props
}: React.ComponentProps<"form">) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold">Create Organization</h1>
				<p className="text-muted-foreground text-sm text-balance">
					Enter your details below to create your organization
				</p>
			</div>
			<OnboardingForm />
		</div>
	);
}

export default CreateOrganizationPage;
