import DashTitle from "@/components/header/dash-title";
import UpdateAccountForm from "./form";

async function UpdateAccountPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<div className="space-y-6">
			<DashTitle title="Update Account" />
			<UpdateAccountForm accountId={id} />
		</div>
	);
}

export default UpdateAccountPage;
