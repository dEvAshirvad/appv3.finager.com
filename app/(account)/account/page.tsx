import React from "react";
import AccountForm from "./form";
import DashTitle from "@/components/header/dash-title";

function AccountPage() {
	return (
		<div>
			{/* Header */}
			<DashTitle title="Account" />
			{/* Content */}
			<div className="p-6">
				<div className="w-full md:w-1/2">
					<AccountForm />
				</div>
			</div>
		</div>
	);
}

export default AccountPage;
