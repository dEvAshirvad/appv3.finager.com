import DashTitle from "@/components/header/dash-title";
import UpdateSupplierForm from "./form";
import { use } from "react";

function UpdateSupplierPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	return (
		<div className="space-y-6">
			<DashTitle title="Update Supplier" />
			<UpdateSupplierForm contactId={id} />
		</div>
	);
}

export default UpdateSupplierPage;

