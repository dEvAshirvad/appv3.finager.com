import React from "react";
import OnboardingForm from "./form";

function OnboardingPage({ className, ...props }: React.ComponentProps<"form">) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold">Onboarding</h1>
				<p className="text-muted-foreground text-sm text-balance">
					Enter your details below to onboard your business
				</p>
			</div>
			<OnboardingForm />
		</div>
	);
}

export default OnboardingPage;
