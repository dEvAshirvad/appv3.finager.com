import DashTitle from "@/components/header/dash-title";
import UpdateCustomerForm from "./form";
import { use } from "react";

function UpdateCustomerPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	return (
		<div className="space-y-6">
			<DashTitle title="Update Customer" />
			<UpdateCustomerForm contactId={id} />
		</div>
	);
}

export default UpdateCustomerPage;

