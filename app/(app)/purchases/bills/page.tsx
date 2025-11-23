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
	CheckCircle2,
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
	Bill,
	BillStatus,
	PaymentMethod,
	useBillList,
	useDeleteBill,
	usePostBill,
	useRecordPayment,
} from "@/queries/bills";
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
		cell: ({ row }: { row: Row<Bill> }) => {
			return <BillNumberCell bill={row.original} />;
		},
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
		accessorKey: "dueDate",
		header: "Due Date",
		cell: ({ row }: { row: Row<Bill> }) => (
			<div className="text-sm">
				{row.original.dueDate ? (
					format(new Date(row.original.dueDate), "dd MMM yyyy")
				) : (
					<span className="text-muted-foreground">—</span>
				)}
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
					: status === BillStatus.RECEIVED
					? "outline"
					: status === BillStatus.CANCELLED
					? "destructive"
					: "secondary";
			return <Badge variant={variant}>{status}</Badge>;
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }: { row: Row<Bill> }) => {
			return <ActionsCell bill={row.original} />;
		},
		enableHiding: false,
	},
];

// Bill Number Cell Component
function BillNumberCell({ bill }: { bill: Bill }) {
	return <div className="text-sm font-mono">{bill.billNumber}</div>;
}

// Actions Cell Component
function ActionsCell({ bill }: { bill: Bill }) {
	const router = useRouter();
	const { mutate: deleteBill, isPending: isDeleting } = useDeleteBill();
	const { mutate: postBill, isPending: isPosting } = usePostBill();
	const { mutate: recordPayment, isPending: isRecordingPayment } =
		useRecordPayment();
	const [showPaymentModal, setShowPaymentModal] = React.useState(false);
	const [paymentAmount, setPaymentAmount] = React.useState("");
	const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
		PaymentMethod.CASH
	);

	const billId = bill.id || bill._id;

	const handleDelete = () => {
		if (confirm(`Are you sure you want to cancel bill "${bill.billNumber}"?`)) {
			deleteBill(billId || "");
		}
	};

	const handlePost = () => {
		if (
			confirm(
				`Are you sure you want to post bill "${bill.billNumber}"? This will create journal entries and update stock.`
			)
		) {
			postBill(billId || "", {
				onSuccess: () => {
					toast.success("Bill posted successfully!");
				},
				onError: () => {
					toast.error("Failed to post bill!");
				},
			});
		}
	};

	const handleRecordPayment = () => {
		const amount = parseFloat(paymentAmount);
		if (!amount || amount <= 0) {
			toast.error("Please enter a valid payment amount");
			return;
		}
		if (amount > bill.balance) {
			toast.error(
				`Payment amount cannot exceed balance of ₹${bill.balance.toLocaleString(
					"en-IN"
				)}`
			);
			return;
		}
		recordPayment(
			{
				id: billId || "",
				data: {
					amount,
					paymentMethod,
				},
			},
			{
				onSuccess: () => {
					setShowPaymentModal(false);
					setPaymentAmount("");
				},
			}
		);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<span className="sr-only">Open menu</span>
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					{bill.status === BillStatus.DRAFT && (
						<>
							<DropdownMenuItem onClick={handlePost} disabled={isPosting}>
								<CheckCircle2 className="mr-2 h-4 w-4" />
								{isPosting ? "Posting..." : "Post Bill"}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{bill.status !== BillStatus.PAID &&
						bill.status !== BillStatus.CANCELLED &&
						bill.balance > 0 && (
							<DropdownMenuItem onClick={() => setShowPaymentModal(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Record Payment
							</DropdownMenuItem>
						)}
					{bill.status === BillStatus.DRAFT && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-destructive focus:text-destructive">
								<Trash2 className="mr-2 h-4 w-4" />
								{isDeleting ? "Cancelling..." : "Cancel"}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Record Payment Modal */}
			<Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Record Payment</DialogTitle>
						<DialogDescription>
							Record a payment for bill {bill.billNumber}. Balance: ₹
							{bill.balance.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="amount">Payment Amount</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0"
								max={bill.balance}
								placeholder="0.00"
								value={paymentAmount}
								onChange={(e) => setPaymentAmount(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="paymentMethod">Payment Method</Label>
							<Select
								value={paymentMethod}
								onValueChange={(value) =>
									setPaymentMethod(value as PaymentMethod)
								}>
								<SelectTrigger id="paymentMethod">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
									<SelectItem value={PaymentMethod.BANK_TRANSFER}>
										Bank Transfer
									</SelectItem>
									<SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
									<SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="flex justify-end gap-3">
						<Button
							variant="outline"
							onClick={() => {
								setShowPaymentModal(false);
								setPaymentAmount("");
							}}>
							Cancel
						</Button>
						<Button onClick={handleRecordPayment} disabled={isRecordingPayment}>
							{isRecordingPayment ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Recording...
								</>
							) : (
								"Record Payment"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default function BillsPage() {
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
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const { data, isLoading, error } = useBillList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
		status: statusFilter !== "all" ? (statusFilter as BillStatus) : undefined,
		sort: sorting[0]?.id || "-date",
	});

	const bills = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		return data.data.docs;
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
				<p className="text-destructive">Error loading bills</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<DashTitle title="Bills" />
			<div className="relative flex flex-col gap-4 overflow-auto p-6">
				{/* Filters */}
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<Input
							placeholder="Search by bill number, supplier, or reference..."
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
							<SelectItem value={BillStatus.DRAFT}>Draft</SelectItem>
							<SelectItem value={BillStatus.RECEIVED}>Received</SelectItem>
							<SelectItem value={BillStatus.PARTIALLY_PAID}>
								Partially Paid
							</SelectItem>
							<SelectItem value={BillStatus.PAID}>Paid</SelectItem>
							<SelectItem value={BillStatus.CANCELLED}>Cancelled</SelectItem>
						</SelectContent>
					</Select>
					<Link href="/purchases/bills/create">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Bill
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
							) : bills.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center">
										No bills found.
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
