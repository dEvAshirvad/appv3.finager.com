import DashTitle from "@/components/header/dash-title";
import CreateAccountForm from "./form";

function CreateAccountPage() {
	return (
		<div className="space-y-6">
			<DashTitle title="Create Account" />
			<CreateAccountForm />
		</div>
	);
}

export default CreateAccountPage;
