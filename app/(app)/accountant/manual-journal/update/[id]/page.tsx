import DashTitle from "@/components/header/dash-title";
import UpdateJournalForm from "./form";

async function UpdateJournalPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<div className="space-y-6">
			<DashTitle title="Update Journal Entry" />
			<UpdateJournalForm journalId={id} />
		</div>
	);
}

export default UpdateJournalPage;

