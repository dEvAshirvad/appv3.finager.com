"use client";

import * as React from "react";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreVertical,
	LayoutGrid,
	Loader2,
	Plus,
	Edit,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	Payment,
	PaymentStatus,
	PaymentMethod,
	usePaymentList,
	useReversePayment,
	paymentKeys,
} from "@/queries/payments";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/queries/auth";
import { format } from "date-fns";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
	return `₹${amount.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const columns: ColumnDef<Payment>[] = [
	{
		id: "select",
		header: ({ table }: { table: TanstackTable<Payment> }) => (
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
		cell: ({ row }: { row: Row<Payment> }) => (
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
		accessorKey: "paymentNumber",
		header: "Payment Number",
		cell: ({ row }: { row: Row<Payment> }) => {
			return <PaymentNumberCell payment={row.original} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "contactName",
		header: "Customer",
		cell: ({ row }: { row: Row<Payment> }) => (
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
		cell: ({ row }: { row: Row<Payment> }) => (
			<div className="text-sm">
				{format(new Date(row.original.date), "dd MMM yyyy")}
			</div>
		),
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }: { row: Row<Payment> }) => (
			<div className="text-sm font-medium">
				{formatCurrency(row.original.amount)}
			</div>
		),
	},
	{
		accessorKey: "paymentMethod",
		header: "Payment Method",
		cell: ({ row }: { row: Row<Payment> }) => (
			<div className="text-sm">
				{row.original.paymentMethod.replace("_", " ")}
			</div>
		),
	},
	{
		accessorKey: "totalAllocated",
		header: "Allocated",
		cell: ({ row }: { row: Row<Payment> }) => (
			<div className="text-sm">
				{formatCurrency(row.original.totalAllocated)}
			</div>
		),
	},
	{
		accessorKey: "unallocatedAmount",
		header: "Unallocated",
		cell: ({ row }: { row: Row<Payment> }) => {
			const unallocated = row.original.unallocatedAmount;
			return (
				<div
					className={`text-sm font-medium ${
						unallocated > 0
							? "text-yellow-600"
							: unallocated < 0
							? "text-red-600"
							: "text-green-600"
					}`}>
					{formatCurrency(Math.abs(unallocated))}
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }: { row: Row<Payment> }) => {
			const status = row.original.status;
			const variant =
				status === PaymentStatus.RECORDED
					? "default"
					: status === PaymentStatus.REVERSED
					? "destructive"
					: "secondary";
			return <Badge variant={variant}>{status}</Badge>;
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }: { row: Row<Payment> }) => {
			return <ActionsCell payment={row.original} />;
		},
		enableHiding: false,
	},
];

// Payment Number Cell Component (clickable to redirect to update page)
function PaymentNumberCell({ payment }: { payment: Payment }) {
	const router = useRouter();

	return (
		<Button
			variant="link"
			className="text-foreground w-fit px-0 text-left font-mono"
			onClick={() =>
				router.push(
					`/sales/payments-received/update/${payment.id || payment._id}`
				)
			}>
			{payment.paymentNumber}
		</Button>
	);
}

// Actions Cell Component
function ActionsCell({ payment }: { payment: Payment }) {
	const router = useRouter();
	const { mutate: reversePayment, isPending: isReversing } =
		useReversePayment();

	const paymentId = payment.id || payment._id;

	const handleReverse = () => {
		if (confirm("Are you sure you want to reverse this payment?")) {
			reversePayment(paymentId || "", {
				onSuccess: () => {
					toast.success("Payment reversed successfully!");
					router.refresh();
				},
				onError: () => {
					toast.error("Failed to reverse payment!");
				},
			});
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<MoreVertical className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() =>
						router.push(`/sales/payments-received/update/${paymentId}`)
					}>
					<Edit className="mr-2 h-4 w-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{payment.status === PaymentStatus.RECORDED && (
					<DropdownMenuItem onClick={handleReverse} disabled={isReversing}>
						<Trash2 className="mr-2 h-4 w-4" />
						{isReversing ? "Reversing..." : "Reverse Payment"}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function PaymentsReceivedPage() {
	const router = useRouter();
	const { data: sessionData } = useSession();
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
	const [statusFilter, setStatusFilter] = React.useState<string>("all");
	const [paymentMethodFilter, setPaymentMethodFilter] =
		React.useState<string>("all");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const { data, isLoading, error } = usePaymentList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
		status:
			statusFilter !== "all" ? (statusFilter as PaymentStatus) : undefined,
		paymentMethod:
			paymentMethodFilter !== "all"
				? (paymentMethodFilter as PaymentMethod)
				: undefined,
		sort: sorting[0]?.id || "-date",
	});

	const payments = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		return data.data.docs;
	}, [data]);

	const table = useReactTable({
		data: payments,
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
			<DashTitle title="Payments Received" />
			<div className="relative flex flex-col gap-4 overflow-auto p-6">
				{/* Filters */}
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<Input
							placeholder="Search by payment number, customer, or reference..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="max-w-sm"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value={PaymentStatus.RECORDED}>Recorded</SelectItem>
							<SelectItem value={PaymentStatus.REVERSED}>Reversed</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={paymentMethodFilter}
						onValueChange={setPaymentMethodFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Methods" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Methods</SelectItem>
							<SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
							<SelectItem value={PaymentMethod.BANK_TRANSFER}>
								Bank Transfer
							</SelectItem>
							<SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
							<SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
							<SelectItem value={PaymentMethod.CHEQUE}>Cheque</SelectItem>
							<SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
						</SelectContent>
					</Select>
					<Link href="/sales/payments-received/create">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Record Payment
						</Button>
					</Link>
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
							) : payments.length === 0 ? (
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
