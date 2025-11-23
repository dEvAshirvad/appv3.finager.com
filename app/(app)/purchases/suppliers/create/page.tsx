import DashTitle from "@/components/header/dash-title";
import CreateSupplierForm from "./form";

function CreateSupplierPage() {
	return (
		<div className="space-y-6">
			<DashTitle title="Create Supplier" />
			<CreateSupplierForm />
		</div>
	);
}

export default CreateSupplierPage;

