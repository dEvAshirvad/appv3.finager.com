"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import DashTitle from "@/components/header/dash-title";
import {
	useGSTList,
	useGSTR1,
	isGSTR1BooksFormat,
	GSTR1BooksFormat,
	GSTR1Summary,
} from "@/queries/gst";
import { format } from "date-fns";

export default function GSTR1Page() {
	const searchParams = useSearchParams();
	const gstIdParam = searchParams.get("gstId");

	const [selectedGstId, setSelectedGstId] = React.useState<string | null>(
		gstIdParam || null
	);
	const [retPeriod, setRetPeriod] = React.useState<string>("");
	const [fy, setFy] = React.useState<string>("");
	const [fromDate, setFromDate] = React.useState<string>("");
	const [toDate, setToDate] = React.useState<string>("");
	const [useBooksFormat, setUseBooksFormat] = React.useState<boolean>(false);

	const { data: gstListData } = useGSTList({ page: 1, limit: 100 });
	const { data: gstr1Data, isLoading } = useGSTR1(
		selectedGstId,
		retPeriod || null,
		fy || null,
		useBooksFormat ? fromDate || null : null,
		useBooksFormat ? toDate || null : null
	);

	// Generate return period options (last 12 months)
	const returnPeriods = React.useMemo(() => {
		const periods: string[] = [];
		const now = new Date();
		for (let i = 0; i < 12; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const year = String(date.getFullYear()).slice(-2);
			periods.push(`${month}${year}`);
		}
		return periods;
	}, []);

	// Generate financial year options
	const financialYears = React.useMemo(() => {
		const years: string[] = [];
		const now = new Date();
		const currentFY =
			now.getMonth() >= 3
				? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`
				: `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
		years.push(currentFY);
		years.push(
			`${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`
		);
		return years;
	}, []);

	// Set default dates based on return period
	React.useEffect(() => {
		if (retPeriod && retPeriod.length === 6) {
			const month = parseInt(retPeriod.slice(0, 2));
			const year = parseInt("20" + retPeriod.slice(2, 4));
			const firstDay = new Date(year, month - 1, 1);
			const lastDay = new Date(year, month, 0);
			setFromDate(format(firstDay, "yyyy-MM-dd"));
			setToDate(format(lastDay, "yyyy-MM-dd"));
		}
	}, [retPeriod]);

	const gstRecords = gstListData?.data?.docs || [];
	const gstr1 = gstr1Data?.data;
	const isBooksFormat = gstr1 && isGSTR1BooksFormat(gstr1);

	return (
		<div className="space-y-6">
			<DashTitle title="Summary of Outward Supplies (GSTR-1)" />

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
					<CardDescription>
						Select GST credentials and return period to view GSTR-1 summary
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>GSTIN</Label>
							<Select
								value={selectedGstId || ""}
								onValueChange={setSelectedGstId}>
								<SelectTrigger>
									<SelectValue placeholder="Select GSTIN" />
								</SelectTrigger>
								<SelectContent>
									{gstRecords.map((gst) => (
										<SelectItem key={gst.id} value={gst.id}>
											{gst.gstin}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Return Period</Label>
							<Select value={retPeriod} onValueChange={setRetPeriod}>
								<SelectTrigger>
									<SelectValue placeholder="Select Period" />
								</SelectTrigger>
								<SelectContent>
									{returnPeriods.map((period) => (
										<SelectItem key={period} value={period}>
											{period}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Financial Year</Label>
							<Select value={fy} onValueChange={setFy}>
								<SelectTrigger>
									<SelectValue placeholder="Select FY" />
								</SelectTrigger>
								<SelectContent>
									{financialYears.map((year) => (
										<SelectItem key={year} value={year}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="useBooksFormat"
								checked={useBooksFormat}
								onChange={(e) => setUseBooksFormat(e.target.checked)}
								className="rounded"
							/>
							<Label htmlFor="useBooksFormat" className="cursor-pointer">
								Use Books Format (from invoices)
							</Label>
						</div>
						{useBooksFormat && (
							<div className="grid grid-cols-2 gap-4 flex-1">
								<div className="space-y-2">
									<Label>From Date</Label>
									<Input
										type="date"
										value={fromDate}
										onChange={(e) => setFromDate(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>To Date</Label>
									<Input
										type="date"
										value={toDate}
										onChange={(e) => setToDate(e.target.value)}
									/>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{isLoading && selectedGstId && retPeriod && fy && (
				<div className="flex items-center justify-center h-64">
					<Loader2 className="size-6 animate-spin" />
				</div>
			)}

			{selectedGstId && retPeriod && fy && !isLoading && gstr1 && (
				<div className="space-y-6">
					{/* Info Banner */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 p-4 flex items-start gap-3">
						<Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
							<p>
								As per GST regulations, all HSN or SAC codes in a transaction
								must be valid. Review and update your codes to stay compliant and
								avoid issues during GST filing. To validate the HSN/SAC codes,
								kindly navigate to the HSN-wise summary section of this report.
							</p>
						</div>
					</div>

					{isBooksFormat ? (
						<GSTR1BooksFormatView data={gstr1} />
					) : (
						<GSTR1APIFormatView data={gstr1 as GSTR1Summary} />
					)}
				</div>
			)}
		</div>
	);
}

function GSTR1APIFormatView({ data }: { data: GSTR1Summary }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>GSTR-1 Summary (Outward Supplies)</CardTitle>
				<CardDescription>Outward Supplies Reconciliation</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Total Invoices</p>
						<p className="text-2xl font-bold">{data.total_invoices}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">B2B Count</p>
						<p className="text-2xl font-bold">{data.b2b.count}</p>
						<p className="text-sm text-muted-foreground">
							₹{data.b2b.value.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">B2C Count</p>
						<p className="text-2xl font-bold">{data.b2c.count}</p>
						<p className="text-sm text-muted-foreground">
							₹{data.b2c.value.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Total Tax</p>
						<p className="text-2xl font-bold">
							₹{data.total_tax.toLocaleString("en-IN")}
						</p>
					</div>
				</div>
				{data.hsn_summary && data.hsn_summary.length > 0 && (
					<div className="pt-4 border-t">
						<p className="text-sm font-medium mb-2">HSN Summary</p>
						<div className="space-y-2">
							{data.hsn_summary.slice(0, 5).map((hsn, idx) => (
								<div key={idx} className="flex justify-between text-sm">
									<span>
										{hsn.hsn} - {hsn.desc}
									</span>
									<span className="font-medium">
										₹{hsn.tax.toLocaleString("en-IN")}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function GSTR1BooksFormatView({ data }: { data: GSTR1BooksFormat }) {
	const periodFrom = format(new Date(data.period.from), "dd/MM/yyyy");
	const periodTo = format(new Date(data.period.to), "dd/MM/yyyy");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{data.description}</CardTitle>
				<CardDescription>
					From {periodFrom} To {periodTo}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Summary Table */}
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>DESCRIPTION</TableHead>
								<TableHead className="text-right">IGST AMOUNT</TableHead>
								<TableHead className="text-right">CGST AMOUNT</TableHead>
								<TableHead className="text-right">SGST AMOUNT</TableHead>
								<TableHead className="text-right">TAXABLE AMOUNT</TableHead>
								<TableHead className="text-right">INVOICE TOTAL</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.summary.map((row, idx) => (
								<TableRow key={idx}>
									<TableCell className="font-medium">
										{row.description}
									</TableCell>
									<TableCell className="text-right">
										₹{row.igstAmount.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell className="text-right">
										₹{row.cgstAmount.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell className="text-right">
										₹{row.sgstAmount.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell className="text-right">
										₹{row.taxableAmount.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell className="text-right">
										₹{row.invoiceTotal.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* HSN Summary */}
				{(data.hsnSummary.b2b.length > 0 || data.hsnSummary.b2c.length > 0) && (
					<div>
						<h3 className="text-lg font-semibold mb-4">
							HSN-wise summary of the B2B Supplies
						</h3>
						{data.hsnSummary.b2b.length > 0 && (
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>HSN</TableHead>
											<TableHead>Description</TableHead>
											<TableHead className="text-right">Qty</TableHead>
											<TableHead className="text-right">Taxable</TableHead>
											<TableHead className="text-right">IGST</TableHead>
											<TableHead className="text-right">CGST</TableHead>
											<TableHead className="text-right">SGST</TableHead>
											<TableHead className="text-right">Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.hsnSummary.b2b.map((hsn, idx) => (
											<TableRow key={idx}>
												<TableCell className="font-medium">{hsn.hsn}</TableCell>
												<TableCell>{hsn.description}</TableCell>
												<TableCell className="text-right">{hsn.qty}</TableCell>
												<TableCell className="text-right">
													₹{hsn.taxable.toLocaleString("en-IN", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</TableCell>
												<TableCell className="text-right">
													₹{hsn.igst.toLocaleString("en-IN", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</TableCell>
												<TableCell className="text-right">
													₹{hsn.cgst.toLocaleString("en-IN", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</TableCell>
												<TableCell className="text-right">
													₹{hsn.sgst.toLocaleString("en-IN", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</TableCell>
												<TableCell className="text-right">
													₹{hsn.total.toLocaleString("en-IN", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

