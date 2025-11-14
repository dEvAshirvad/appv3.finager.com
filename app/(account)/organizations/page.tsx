import React from "react";
import OrganizationForm from "./form";
import DashTitle from "@/components/header/dash-title";

function OrganizationsPage() {
	return (
		<div>
			{/* Header */}
			<DashTitle title="Organizations" />
			{/* Content */}
			<div className="p-6">
				<div className="w-full md:w-1/2">
					<OrganizationForm />
				</div>
			</div>
		</div>
	);
}

export default OrganizationsPage;
