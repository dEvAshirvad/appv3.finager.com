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
	FileText,
	Edit,
	Trash2,
	CheckCircle2,
	RotateCcw,
} from "lucide-react";
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
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	JournalEntry,
	JournalStatus,
	TransactionType,
	useJournalList,
	useJournal,
	useDeleteJournal,
	usePostJournal,
	useReverseJournal,
} from "@/queries/journal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { useSession } from "@/queries/auth";

const columns: ColumnDef<JournalEntry>[] = [
	{
		id: "select",
		header: ({ table }: { table: TanstackTable<JournalEntry> }) => (
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
		cell: ({ row }: { row: Row<JournalEntry> }) => (
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
		accessorKey: "name",
		header: "Journal Entry Name",
		cell: ({ row }: { row: Row<JournalEntry> }) => {
			return <JournalNameCell journal={row.original} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ row }: { row: Row<JournalEntry> }) => {
			const date = new Date(row.original.date);
			return <div className="text-sm">{format(date, "MMM dd, yyyy")}</div>;
		},
	},
	{
		accessorKey: "reference",
		header: "Reference",
		cell: ({ row }: { row: Row<JournalEntry> }) => (
			<div className="text-sm">
				{row.original.reference || (
					<span className="text-muted-foreground">—</span>
				)}
			</div>
		),
	},
	{
		accessorKey: "transactions",
		header: "Transactions",
		cell: ({ row }: { row: Row<JournalEntry> }) => (
			<div className="text-sm">{row.original.transactions.length} entries</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }: { row: Row<JournalEntry> }) => {
			const status = row.original.status;
			const variant =
				status === JournalStatus.POSTED
					? "default"
					: status === JournalStatus.REVERSED
					? "secondary"
					: "outline";
			return (
				<Badge variant={variant} className="capitalize">
					{status}
				</Badge>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }: { row: Row<JournalEntry> }) => {
			return <ActionsCell journal={row.original} />;
		},
	},
];

// Journal Name Cell Component (clickable to show details)
function JournalNameCell({ journal }: { journal: JournalEntry }) {
	const isMobile = useIsMobile();
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<Drawer
			direction={isMobile ? "bottom" : "right"}
			open={isOpen}
			onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Button variant="link" className="text-foreground w-fit px-0 text-left">
					{journal.name}
				</Button>
			</DrawerTrigger>
			<DrawerContent className="max-w-2xl">
				<JournalDetailsPanel
					journal={journal}
					onClose={() => setIsOpen(false)}
				/>
			</DrawerContent>
		</Drawer>
	);
}

// Journal Details Panel Component
function JournalDetailsPanel({
	journal,
	onClose,
}: {
	journal: JournalEntry;
	onClose: () => void;
}) {
	const { data: journalData, isLoading } = useJournal(journal._id);
	const fullJournal = journalData?.data || journal;

	const totalDebits = React.useMemo(() => {
		return fullJournal.transactions
			.filter((t) => t.type === TransactionType.DEBIT)
			.reduce((sum, t) => sum + t.amount, 0);
	}, [fullJournal.transactions]);

	const totalCredits = React.useMemo(() => {
		return fullJournal.transactions
			.filter((t) => t.type === TransactionType.CREDIT)
			.reduce((sum, t) => sum + t.amount, 0);
	}, [fullJournal.transactions]);

	return (
		<div className="flex flex-col h-full">
			<DrawerHeader className="border-b">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<DrawerTitle className="text-2xl">{fullJournal.name}</DrawerTitle>
						<DrawerDescription className="mt-1">
							{format(new Date(fullJournal.date), "MMM dd, yyyy")}
						</DrawerDescription>
					</div>
					<div className="flex items-center gap-2">
						<Link href={`/accountant/manual-journal/update/${fullJournal._id}`}>
							<Button variant="outline" size="sm">
								<Edit className="h-4 w-4 mr-2" />
								Edit
							</Button>
						</Link>
						<DrawerClose asChild>
							<Button variant="ghost" size="icon">
								×
							</Button>
						</DrawerClose>
					</div>
				</div>
			</DrawerHeader>

			<div className="flex-1 overflow-y-auto p-6 space-y-6">
				{/* Status */}
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						Status
					</h3>
					<Badge
						variant={
							fullJournal.status === JournalStatus.POSTED
								? "default"
								: fullJournal.status === JournalStatus.REVERSED
								? "secondary"
								: "outline"
						}
						className="capitalize">
						{fullJournal.status}
					</Badge>
				</div>

				<Separator />

				{/* Description */}
				{fullJournal.description && (
					<div className="space-y-2">
						<h3 className="text-sm font-semibold">Description</h3>
						<p className="text-sm text-muted-foreground">
							{fullJournal.description}
						</p>
					</div>
				)}

				{/* Reference */}
				{fullJournal.reference && (
					<div className="space-y-2">
						<h3 className="text-sm font-semibold">Reference</h3>
						<p className="text-sm font-mono">{fullJournal.reference}</p>
					</div>
				)}

				<Separator />

				{/* Transactions */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold">Transactions</h3>
					<div className="space-y-2">
						{fullJournal.transactions.map((transaction, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-3 border rounded-md">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<Badge
											variant={
												transaction.type === TransactionType.DEBIT
													? "default"
													: "secondary"
											}>
											{transaction.type.toUpperCase()}
										</Badge>
										<span className="text-sm font-medium">
											₹{transaction.amount.toLocaleString()}
										</span>
									</div>
									{transaction.description && (
										<p className="text-xs text-muted-foreground mt-1">
											{transaction.description}
										</p>
									)}
									<p className="text-xs text-muted-foreground mt-1">
										Account:{" "}
										{typeof transaction.accountId === "string"
											? transaction.accountId
											: (transaction.accountId as any)?.name ||
											  (transaction.accountId as any)?._id ||
											  "N/A"}
									</p>
								</div>
							</div>
						))}
					</div>
					<div className="flex items-center justify-between pt-4 border-t">
						<div>
							<span className="text-sm font-semibold">Total Debits:</span>
							<span className="ml-2 text-sm">
								₹{totalDebits.toLocaleString()}
							</span>
						</div>
						<div>
							<span className="text-sm font-semibold">Total Credits:</span>
							<span className="ml-2 text-sm">
								₹{totalCredits.toLocaleString()}
							</span>
						</div>
					</div>
					{totalDebits !== totalCredits && (
						<div className="text-sm text-destructive">
							⚠️ Debits and Credits do not match!
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Actions Cell Component
function ActionsCell({ journal }: { journal: JournalEntry }) {
	const deleteMutation = useDeleteJournal();
	const postMutation = usePostJournal();
	const reverseMutation = useReverseJournal();
	const router = useRouter();

	const canPost = journal.status === JournalStatus.DRAFT;
	const canReverse = journal.status === JournalStatus.POSTED;

	return (
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
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem
					onClick={() =>
						router.push(`/accountant/manual-journal/update/${journal._id}`)
					}>
					<Edit className="mr-2 h-4 w-4" />
					Edit
				</DropdownMenuItem>
				{canPost && (
					<DropdownMenuItem
						onClick={() => {
							if (
								confirm(
									`Are you sure you want to post "${journal.name}"? This action cannot be undone.`
								)
							) {
								postMutation.mutate(journal._id);
							}
						}}>
						<CheckCircle2 className="mr-2 h-4 w-4" />
						Post
					</DropdownMenuItem>
				)}
				{canReverse && (
					<DropdownMenuItem
						onClick={() => {
							if (
								confirm(
									`Are you sure you want to reverse "${journal.name}"? This will create offsetting entries.`
								)
							) {
								reverseMutation.mutate(journal._id);
							}
						}}>
						<RotateCcw className="mr-2 h-4 w-4" />
						Reverse
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onClick={() => {
						if (confirm(`Are you sure you want to delete "${journal.name}"?`)) {
							deleteMutation.mutate(journal._id);
						}
					}}>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function JournalTable() {
	const router = useRouter();
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: "date", desc: true },
	]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [searchQuery, setSearchQuery] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<string>("all");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const { data: sessionData } = useSession();
	const { data, isLoading, error } = useJournalList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
		sort: sorting[0]?.id || "date",
		status:
			statusFilter !== "all" ? (statusFilter as JournalStatus) : undefined,
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const journals = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		return data.data.docs;
	}, [data]);

	const table = useReactTable({
		data: journals,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row._id,
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
				<p className="text-destructive">Error loading journal entries</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Manual Journal" />
			<div className="flex items-center justify-between px-4 lg:px-6">
				<div className="flex items-center gap-2 flex-1">
					<Input
						placeholder="Search journal entries..."
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
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value={JournalStatus.DRAFT}>Draft</SelectItem>
							<SelectItem value={JournalStatus.POSTED}>Posted</SelectItem>
							<SelectItem value={JournalStatus.REVERSED}>Reversed</SelectItem>
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
					<Link href="/accountant/manual-journal/create">
						<Button size="sm">
							<Plus />
							<span className="hidden lg:inline">New Entry</span>
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
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center">
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount() || 1}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}>
								<span className="sr-only">Go to first page</span>
								<ChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}>
								<span className="sr-only">Go to previous page</span>
								<ChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}>
								<span className="sr-only">Go to next page</span>
								<ChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}>
								<span className="sr-only">Go to last page</span>
								<ChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function ManualJournalPage() {
	return <JournalTable />;
}

export default ManualJournalPage;
