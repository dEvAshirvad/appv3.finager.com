"use client";

import { use } from "react";
import UpdatePaymentForm from "./form";

export default function UpdatePaymentPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const paymentId = resolvedParams.id;

	return (
		<div className="space-y-6">
			<UpdatePaymentForm paymentId={paymentId} />
		</div>
	);
}

