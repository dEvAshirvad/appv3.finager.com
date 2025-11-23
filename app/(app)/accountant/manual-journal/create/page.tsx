import DashTitle from "@/components/header/dash-title";
import CreateJournalForm from "./form";

function CreateJournalPage() {
	return (
		<div className="space-y-6">
			<DashTitle title="Create Journal Entry" />
			<CreateJournalForm />
		</div>
	);
}

export default CreateJournalPage;

