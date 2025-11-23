import DashTitle from "@/components/header/dash-title";
import CreateCustomerForm from "./form";

function CreateCustomerPage() {
	return (
		<div className="space-y-6">
			<DashTitle title="Create Customer" />
			<CreateCustomerForm />
		</div>
	);
}

export default CreateCustomerPage;

