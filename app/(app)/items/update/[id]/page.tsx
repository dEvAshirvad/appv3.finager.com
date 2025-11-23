import DashTitle from "@/components/header/dash-title";
import UpdateItemForm from "./form";
import { use } from "react";

function UpdateItemPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	return (
		<div className="space-y-6">
			<DashTitle title="Update Item" />
			<UpdateItemForm itemId={id} />
		</div>
	);
}

export default UpdateItemPage;

