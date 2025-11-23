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
	Invoice,
	InvoiceStatus,
	PaymentMethod,
	useInvoiceList,
	useDeleteInvoice,
	usePostInvoice,
	useRecordPayment,
} from "@/queries/invoices";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/queries/auth";
import { format } from "date-fns";

const columns: ColumnDef<Invoice>[] = [
	{
		id: "select",
		header: ({ table }: { table: TanstackTable<Invoice> }) => (
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
		cell: ({ row }: { row: Row<Invoice> }) => (
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
		accessorKey: "invoiceNumber",
		header: "Invoice Number",
		cell: ({ row }: { row: Row<Invoice> }) => {
			return <InvoiceNumberCell invoice={row.original} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "contactName",
		header: "Customer",
		cell: ({ row }: { row: Row<Invoice> }) => (
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
		cell: ({ row }: { row: Row<Invoice> }) => (
			<div className="text-sm">
				{format(new Date(row.original.date), "dd MMM yyyy")}
			</div>
		),
	},
	{
		accessorKey: "dueDate",
		header: "Due Date",
		cell: ({ row }: { row: Row<Invoice> }) => (
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
		cell: ({ row }: { row: Row<Invoice> }) => (
			<div className="text-sm font-medium">
				₹
				{row.original.total.toLocaleString("en-IN", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}
			</div>
		),
	},
	{
		accessorKey: "paidAmount",
		header: "Paid",
		cell: ({ row }: { row: Row<Invoice> }) => (
			<div className="text-sm">
				₹
				{row.original.paidAmount.toLocaleString("en-IN", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}
			</div>
		),
	},
	{
		accessorKey: "balance",
		header: "Balance",
		cell: ({ row }: { row: Row<Invoice> }) => (
			<div
				className={`text-sm font-medium ${
					row.original.balance > 0 ? "text-red-600" : "text-green-600"
				}`}>
				₹
				{Math.abs(row.original.balance).toLocaleString("en-IN", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }: { row: Row<Invoice> }) => {
			const status = row.original.status;
			const variant =
				status === InvoiceStatus.PAID
					? "default"
					: status === InvoiceStatus.PARTIALLY_PAID
					? "secondary"
					: status === InvoiceStatus.SENT
					? "outline"
					: status === InvoiceStatus.CANCELLED
					? "destructive"
					: "secondary";
			return <Badge variant={variant}>{status}</Badge>;
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }: { row: Row<Invoice> }) => {
			return <ActionsCell invoice={row.original} />;
		},
		enableHiding: false,
	},
];

// Invoice Number Cell Component
function InvoiceNumberCell({ invoice }: { invoice: Invoice }) {
	return <div className="text-sm font-mono">{invoice.invoiceNumber}</div>;
}

// Actions Cell Component
function ActionsCell({ invoice }: { invoice: Invoice }) {
	const router = useRouter();
	const deleteMutation = useDeleteInvoice();
	const postMutation = usePostInvoice();
	const recordPaymentMutation = useRecordPayment();
	const [showPaymentModal, setShowPaymentModal] = React.useState(false);
	const [paymentAmount, setPaymentAmount] = React.useState("");
	const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
		PaymentMethod.CASH
	);

	const handlePost = () => {
		if (
			confirm(
				`Are you sure you want to post invoice "${invoice.invoiceNumber}"? This will create journal entries and update stock.`
			)
		) {
			postMutation.mutate(invoice.id);
		}
	};

	const handleRecordPayment = () => {
		const amount = parseFloat(paymentAmount);
		if (!amount || amount <= 0) {
			alert("Please enter a valid payment amount");
			return;
		}
		if (amount > invoice.balance) {
			alert(
				`Payment amount cannot exceed balance of ₹${invoice.balance.toLocaleString(
					"en-IN"
				)}`
			);
			return;
		}
		recordPaymentMutation.mutate(
			{
				id: invoice.id,
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
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						size="icon">
						<MoreVertical />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={handlePost}>
						<Edit className="mr-2 h-4 w-4" />
						Post Invoice
					</DropdownMenuItem>
					{invoice.status === InvoiceStatus.DRAFT && (
						<>
							<DropdownMenuSeparator />
						</>
					)}
					{invoice.status !== InvoiceStatus.PAID &&
						invoice.status !== InvoiceStatus.CANCELLED &&
						invoice.balance > 0 && (
							<DropdownMenuItem onClick={() => setShowPaymentModal(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Record Payment
							</DropdownMenuItem>
						)}
					{invoice.status === InvoiceStatus.DRAFT && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => {
									if (
										confirm(
											`Are you sure you want to cancel invoice "${invoice.invoiceNumber}"?`
										)
									) {
										deleteMutation.mutate(invoice.id);
									}
								}}>
								<Trash2 className="mr-2 h-4 w-4" />
								Cancel
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
							Record a payment for invoice {invoice.invoiceNumber}. Balance: ₹
							{invoice.balance.toLocaleString("en-IN", {
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
								max={invoice.balance}
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
						<Button
							onClick={handleRecordPayment}
							disabled={recordPaymentMutation.isPending}>
							{recordPaymentMutation.isPending ? (
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

export default function InvoicesPage() {
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

	const { data, isLoading, error } = useInvoiceList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
		status:
			statusFilter !== "all" ? (statusFilter as InvoiceStatus) : undefined,
		sort: sorting[0]?.id || "-date",
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const invoices = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		return data.data.docs;
	}, [data]);

	const table = useReactTable({
		data: invoices,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id,
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
				<Loader2 className="size-6 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Error loading invoices</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Invoices" />
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 lg:px-6">
				<div className="flex items-center gap-2 flex-1 w-full md:w-auto">
					<Input
						placeholder="Search invoices..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setPagination({ ...pagination, pageIndex: 0 });
						}}
						className="max-w-sm"
					/>
					<Select
						value={statusFilter}
						onValueChange={(value) => {
							setStatusFilter(value);
							setPagination({ ...pagination, pageIndex: 0 });
						}}>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
							<SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
							<SelectItem value={InvoiceStatus.PARTIALLY_PAID}>
								Partially Paid
							</SelectItem>
							<SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
							<SelectItem value={InvoiceStatus.CANCELLED}>Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<LayoutGrid />
								<span className="hidden lg:inline">Customize Columns</span>
								<span className="lg:hidden">Columns</span>
								<ChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter(
									(column: any) =>
										typeof column.accessorFn !== "undefined" &&
										column.getCanHide()
								)
								.map((column: any) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
					<Link href="/sales/invoices/create">
						<Button size="sm">
							<Plus />
							<span className="hidden lg:inline">Add Invoice</span>
						</Button>
					</Link>
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
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
							) : invoices.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center">
										No invoices found.
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
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}>
							<ChevronsLeft />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}>
							<ChevronLeft />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}>
							<ChevronRight />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}>
							<ChevronsRight />
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount() || 1}
						</span>
						<span className="text-sm text-muted-foreground">
							({data?.data?.totalDocs || 0} total)
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
