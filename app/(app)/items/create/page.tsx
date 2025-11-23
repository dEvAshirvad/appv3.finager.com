import DashTitle from "@/components/header/dash-title";
import CreateItemForm from "./form";

function CreateItemPage() {
	return (
		<div className="space-y-6">
			<DashTitle title="Create Item" />
			<CreateItemForm />
		</div>
	);
}

export default CreateItemPage;

