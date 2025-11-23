"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Info, Download } from "lucide-react";
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
	useGSTR3B,
	isGSTR3BBooksFormat,
	GSTR3BBooksFormat,
	GSTR3BSummary,
} from "@/queries/gst";
import { format } from "date-fns";

export default function GSTR3BPage() {
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
	const { data: gstr3bData, isLoading } = useGSTR3B(
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
	const gstr3b = gstr3bData?.data;
	const isBooksFormat = gstr3b && isGSTR3BBooksFormat(gstr3b);

	return (
		<div className="space-y-6">
			<DashTitle title="GSTR-3B Summary" />

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
					<CardDescription>
						Select GST credentials and return period to view GSTR-3B summary
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
								Use Books Format (from invoices/bills)
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

			{selectedGstId && retPeriod && fy && !isLoading && gstr3b && (
				<div className="space-y-6">
					{/* Info Banner */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 p-4 flex items-start gap-3">
						<Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
							<p>
								As per GST regulations, all HSN or SAC codes in a transaction
								must be valid. Review and update your codes to stay compliant and
								avoid issues during GST filing.
							</p>
						</div>
					</div>

					{isBooksFormat ? (
						<GSTR3BBooksFormatView data={gstr3b} />
					) : (
						<GSTR3BAPIFormatView data={gstr3b as GSTR3BSummary} />
					)}
				</div>
			)}
		</div>
	);
}

function GSTR3BAPIFormatView({ data }: { data: GSTR3BSummary }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>GSTR-3B Summary</CardTitle>
				<CardDescription>
					Return Period: {data.ret_period} | Status: {data.status}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">CGST Liability</p>
						<p className="text-2xl font-bold">
							₹{data.liability.cgst.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">SGST Liability</p>
						<p className="text-2xl font-bold">
							₹{data.liability.sgst.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">IGST Liability</p>
						<p className="text-2xl font-bold">
							₹{data.liability.igst.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Total Liability</p>
						<p className="text-2xl font-bold">
							₹{data.liability.total.toLocaleString("en-IN")}
						</p>
					</div>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
					<div>
						<p className="text-sm text-muted-foreground">ITC CGST</p>
						<p className="text-2xl font-bold text-green-600">
							₹{data.itc.cgst.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">ITC SGST</p>
						<p className="text-2xl font-bold text-green-600">
							₹{data.itc.sgst.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">ITC IGST</p>
						<p className="text-2xl font-bold text-green-600">
							₹{data.itc.igst.toLocaleString("en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Total ITC</p>
						<p className="text-2xl font-bold text-green-600">
							₹{data.itc.total_eligible.toLocaleString("en-IN")}
						</p>
					</div>
				</div>
				<div className="pt-4 border-t">
					<div className="flex justify-between items-center">
						<div>
							<p className="text-sm text-muted-foreground">Net Payable</p>
							<p
								className={`text-3xl font-bold ${
									data.net_payable >= 0 ? "text-red-600" : "text-green-600"
								}`}>
								₹{Math.abs(data.net_payable).toLocaleString("en-IN")}
							</p>
						</div>
						{data.late_fee > 0 && (
							<div>
								<p className="text-sm text-muted-foreground">Late Fee</p>
								<p className="text-2xl font-bold text-destructive">
									₹{data.late_fee.toLocaleString("en-IN")}
								</p>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function GSTR3BBooksFormatView({ data }: { data: GSTR3BBooksFormat }) {
	const periodFrom = format(new Date(data.period.from), "dd/MM/yyyy");
	const periodTo = format(new Date(data.period.to), "dd/MM/yyyy");

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{data.description}</CardTitle>
					<CardDescription>
						From {periodFrom} To {periodTo}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Section 3.1 */}
					<div>
						<h3 className="text-lg font-semibold mb-4">
							{data.section3_1.title}
						</h3>
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nature of Supply</TableHead>
										<TableHead className="text-right">Taxable Value</TableHead>
										<TableHead className="text-right">Integrated Tax</TableHead>
										<TableHead className="text-right">Central Tax</TableHead>
										<TableHead className="text-right">State/UT Tax</TableHead>
										<TableHead className="text-right">CESS Tax</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.section3_1.rows.map((row, idx) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{row.nature}</TableCell>
											<TableCell className="text-right">
												₹{row.taxableValue.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.integratedTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.centralTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.stateTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.cessTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="font-bold bg-muted/50">
										<TableCell>Total value</TableCell>
										<TableCell className="text-right">
											₹{data.section3_1.total.taxableValue.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section3_1.total.integratedTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section3_1.total.centralTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section3_1.total.stateTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section3_1.total.cessTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>

					{/* Section 4 */}
					<div>
						<h3 className="text-lg font-semibold mb-4">{data.section4.title}</h3>
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Details</TableHead>
										<TableHead className="text-right">Integrated Tax</TableHead>
										<TableHead className="text-right">Central Tax</TableHead>
										<TableHead className="text-right">State/UT Tax</TableHead>
										<TableHead className="text-right">CESS Tax</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.section4.rows.map((row, idx) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{row.detail}</TableCell>
											<TableCell className="text-right">
												₹{row.integratedTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.centralTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.stateTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
											<TableCell className="text-right">
												₹{row.cessTax.toLocaleString("en-IN", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="font-bold bg-muted/50">
										<TableCell>Total</TableCell>
										<TableCell className="text-right">
											₹{data.section4.total.integratedTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section4.total.centralTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section4.total.stateTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
										<TableCell className="text-right">
											₹{data.section4.total.cessTax.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>

					{/* Summary */}
					<div className="rounded-lg border p-6 bg-muted/50">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Total Liability</p>
								<p className="text-2xl font-bold">
									₹{data.summary.totalLiability.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Total ITC</p>
								<p className="text-2xl font-bold text-green-600">
									₹{data.summary.totalITC.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Net Payable</p>
								<p
									className={`text-2xl font-bold ${
										data.summary.netPayable >= 0 ? "text-red-600" : "text-green-600"
									}`}>
									₹{Math.abs(data.summary.netPayable).toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Late Fee</p>
								<p className="text-2xl font-bold">
									₹{data.summary.lateFee.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

