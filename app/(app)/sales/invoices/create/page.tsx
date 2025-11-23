import DashTitle from "@/components/header/dash-title";
import CreateInvoiceForm from "./form";

function CreateInvoicePage() {
	return (
		<div className="space-y-6">
			<DashTitle title="Create Invoice" />
			<CreateInvoiceForm />
		</div>
	);
}

export default CreateInvoicePage;

