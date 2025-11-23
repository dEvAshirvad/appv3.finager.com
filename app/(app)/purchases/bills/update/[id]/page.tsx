"use client";

import { use } from "react";
import UpdateBillForm from "./form";

export default function UpdateBillPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const billId = resolvedParams.id;

	return (
		<div className="space-y-6">
			<UpdateBillForm billId={billId} />
		</div>
	);
}

