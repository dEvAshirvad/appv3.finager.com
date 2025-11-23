"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import DashTitle from "@/components/header/dash-title";
import { useGSTList, useGSTR3B, useGSTR1, useGSTR2 } from "@/queries/gst";
import { format } from "date-fns";

export default function GSTReportsPage() {
	const searchParams = useSearchParams();
	const gstIdParam = searchParams.get("gstId");

	const [selectedGstId, setSelectedGstId] = React.useState<string | null>(
		gstIdParam || null
	);
	const [retPeriod, setRetPeriod] = React.useState<string>("");
	const [fy, setFy] = React.useState<string>("");

	const { data: gstListData } = useGSTList({ page: 1, limit: 100 });
	const { data: gstr3bData, isLoading: isLoading3B } = useGSTR3B(
		selectedGstId,
		retPeriod || null,
		fy || null
	);
	const { data: gstr1Data, isLoading: isLoading1 } = useGSTR1(
		selectedGstId,
		retPeriod || null,
		fy || null
	);
	const { data: gstr2Data, isLoading: isLoading2 } = useGSTR2(
		selectedGstId,
		retPeriod || null,
		fy || null
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
		const currentFY = now.getMonth() >= 3 
			? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`
			: `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
		years.push(currentFY);
		years.push(`${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`);
		return years;
	}, []);

	const gstRecords = gstListData?.data?.docs || [];
	const gstr3b = gstr3bData?.data?.data;
	const gstr1 = gstr1Data?.data?.data;
	const gstr2 = gstr2Data?.data?.data;

	const isLoading = isLoading3B || isLoading1 || isLoading2;

	return (
		<div className="space-y-6">
			<DashTitle title="GST Reports" />
			
			<Card>
				<CardHeader>
					<CardTitle>Select GST Credentials & Period</CardTitle>
					<CardDescription>
						Choose GST credentials and return period to view reports
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">GSTIN</label>
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
							<label className="text-sm font-medium">Return Period</label>
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
							<label className="text-sm font-medium">Financial Year</label>
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
				</CardContent>
			</Card>

			{isLoading && selectedGstId && retPeriod && fy && (
				<div className="flex items-center justify-center h-64">
					<Loader2 className="size-6 animate-spin" />
				</div>
			)}

			{selectedGstId && retPeriod && fy && !isLoading && (
				<div className="grid gap-6">
					{/* GSTR-3B Summary */}
					{gstr3b && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									GSTR-3B Summary
								</CardTitle>
								<CardDescription>Liability & ITC Summary</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">CGST</p>
										<p className="text-2xl font-bold">₹{gstr3b.liability.cgst.toLocaleString("en-IN")}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">SGST</p>
										<p className="text-2xl font-bold">₹{gstr3b.liability.sgst.toLocaleString("en-IN")}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">IGST</p>
										<p className="text-2xl font-bold">₹{gstr3b.liability.igst.toLocaleString("en-IN")}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Total Liability</p>
										<p className="text-2xl font-bold">₹{gstr3b.liability.total.toLocaleString("en-IN")}</p>
									</div>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
									<div>
										<p className="text-sm text-muted-foreground">ITC CGST</p>
										<p className="text-2xl font-bold text-green-600">
											<TrendingUp className="inline h-4 w-4 mr-1" />
											₹{gstr3b.itc.cgst.toLocaleString("en-IN")}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">ITC SGST</p>
										<p className="text-2xl font-bold text-green-600">
											<TrendingUp className="inline h-4 w-4 mr-1" />
											₹{gstr3b.itc.sgst.toLocaleString("en-IN")}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Total ITC</p>
										<p className="text-2xl font-bold text-green-600">
											<TrendingUp className="inline h-4 w-4 mr-1" />
											₹{gstr3b.itc.total_eligible.toLocaleString("en-IN")}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Net Payable</p>
										<p className={`text-2xl font-bold ${gstr3b.net_payable >= 0 ? "text-red-600" : "text-green-600"}`}>
											{gstr3b.net_payable >= 0 ? (
												<TrendingDown className="inline h-4 w-4 mr-1" />
											) : (
												<TrendingUp className="inline h-4 w-4 mr-1" />
											)}
											₹{Math.abs(gstr3b.net_payable).toLocaleString("en-IN")}
										</p>
									</div>
								</div>
								<div className="pt-4 border-t">
									<p className="text-sm text-muted-foreground">Status: <span className="font-medium">{gstr3b.status}</span></p>
									{gstr3b.late_fee > 0 && (
										<p className="text-sm text-destructive mt-2">
											Late Fee: ₹{gstr3b.late_fee.toLocaleString("en-IN")}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* GSTR-1 Summary */}
					{gstr1 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									GSTR-1 Summary (Outward Supplies)
								</CardTitle>
								<CardDescription>Outward Supplies Reconciliation</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Total Invoices</p>
										<p className="text-2xl font-bold">{gstr1.total_invoices}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">B2B Count</p>
										<p className="text-2xl font-bold">{gstr1.b2b.count}</p>
										<p className="text-sm text-muted-foreground">₹{gstr1.b2b.value.toLocaleString("en-IN")}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">B2C Count</p>
										<p className="text-2xl font-bold">{gstr1.b2c.count}</p>
										<p className="text-sm text-muted-foreground">₹{gstr1.b2c.value.toLocaleString("en-IN")}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Total Tax</p>
										<p className="text-2xl font-bold">₹{gstr1.total_tax.toLocaleString("en-IN")}</p>
									</div>
								</div>
								{gstr1.hsn_summary && gstr1.hsn_summary.length > 0 && (
									<div className="pt-4 border-t">
										<p className="text-sm font-medium mb-2">HSN Summary</p>
										<div className="space-y-2">
											{gstr1.hsn_summary.slice(0, 5).map((hsn, idx) => (
												<div key={idx} className="flex justify-between text-sm">
													<span>{hsn.hsn} - {hsn.desc}</span>
													<span className="font-medium">₹{hsn.tax.toLocaleString("en-IN")}</span>
												</div>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* GSTR-2A/2B Summary */}
					{gstr2 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									GSTR-2A/2B Summary (Inward Supplies)
								</CardTitle>
								<CardDescription>Inward Supplies & ITC Eligibility</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Total Suppliers</p>
										<p className="text-2xl font-bold">{gstr2.total_suppliers}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">B2B Invoices</p>
										<p className="text-2xl font-bold">{gstr2.b2b_invoices}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Taxable Value</p>
										<p className="text-2xl font-bold">₹{gstr2.total_taxable_value.toLocaleString("en-IN")}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Total ITC</p>
										<p className="text-2xl font-bold text-green-600">
											₹{(gstr2.total_itc.cgst + gstr2.total_itc.sgst + gstr2.total_itc.igst).toLocaleString("en-IN")}
										</p>
									</div>
								</div>
								<div className="pt-4 border-t grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Mismatched Invoices</p>
										<p className="text-2xl font-bold text-yellow-600">{gstr2.mismatched_invoices}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Missing in Books</p>
										<p className="text-2xl font-bold text-red-600">{gstr2.missing_in_books}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}

