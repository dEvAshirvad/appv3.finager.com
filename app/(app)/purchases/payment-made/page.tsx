"use client";

import * as React from "react";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	Row,
	SortingState,
	useReactTable,
	VisibilityState,
	Table as TanstackTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import DashTitle from "@/components/header/dash-title";
import { Bill, BillStatus, useBillList } from "@/queries/bills";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
	return `₹${amount.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const columns: ColumnDef<Bill>[] = [
	{
		id: "select",
		header: ({ table }: { table: TanstackTable<Bill> }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			</div>
		),
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "billNumber",
		header: "Bill Number",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="text-sm font-mono">{row.original.billNumber}</div>
		),
		enableHiding: false,
	},
	{
		accessorKey: "contactName",
		header: "Supplier",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="text-sm">
				{row.original.contactName || (
					<span className="text-muted-foreground">—</span>
				)}
			</div>
		),
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="text-sm">
				{format(new Date(row.original.date), "dd MMM yyyy")}
			</div>
		),
	},
	{
		accessorKey: "total",
		header: "Total",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="text-sm font-medium">
				{formatCurrency(row.original.total)}
			</div>
		),
	},
	{
		accessorKey: "paidAmount",
		header: "Paid",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="text-sm">{formatCurrency(row.original.paidAmount)}</div>
		),
	},
	{
		accessorKey: "balance",
		header: "Balance",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div
				className={`text-sm font-medium ${
					row.original.balance > 0 ? "text-red-600" : "text-green-600"
				}`}>
				{formatCurrency(Math.abs(row.original.balance))}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }: { row: Row<Bill> }) => {
			const status = row.original.status;
			const variant =
				status === BillStatus.PAID
					? "default"
					: status === BillStatus.PARTIALLY_PAID
					? "secondary"
					: "outline";
			return <Badge variant={variant}>{status}</Badge>;
		},
	},
];

export default function PaymentMadePage() {
	const router = useRouter();
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [searchQuery, setSearchQuery] = React.useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	// Fetch bills with status PAID or PARTIALLY_PAID
	const { data, isLoading, error } = useBillList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
		status: BillStatus.PAID, // This will show paid bills, we'll filter for PARTIALLY_PAID in the UI
		sort: sorting[0]?.id || "-date",
	});

	const bills = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		// Filter to show only PAID and PARTIALLY_PAID bills
		return data.data.docs.filter(
			(bill) =>
				bill.status === BillStatus.PAID ||
				bill.status === BillStatus.PARTIALLY_PAID
		);
	}, [data]);

	const table = useReactTable({
		data: bills,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id || row._id || "",
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		manualPagination: true,
		pageCount: data?.data?.totalPages ?? 0,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Error loading payments</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<DashTitle title="Payments Made" />
			<div className="relative flex flex-col gap-4 overflow-auto p-6">
				{/* Search */}
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<Input
							placeholder="Search by bill number, supplier, or reference..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="max-w-sm"
						/>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup: any) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header: any) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext()
													  )}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center">
										<Loader2 className="h-6 w-6 animate-spin mx-auto" />
									</TableCell>
								</TableRow>
							) : bills.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center">
										No payments found.
									</TableCell>
								</TableRow>
							) : (
								table.getRowModel().rows.map((row: any) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}>
										{row.getVisibleCells().map((cell: any) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<div className="text-sm">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
