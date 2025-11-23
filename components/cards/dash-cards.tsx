import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowUp } from "lucide-react";

function DashCards({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<Card className="rounded-md">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{title}</CardTitle>
					<Badge className="bg-green-500 text-white">
						<ArrowUp /> 10%
					</Badge>
				</div>
				<div className="">
					<p className="text-3xl font-bold">$ 10,000</p>
					<p className="text-sm text-muted-foreground">Last 30 days</p>
				</div>
			</CardHeader>
		</Card>
	);
}

export default DashCards;
