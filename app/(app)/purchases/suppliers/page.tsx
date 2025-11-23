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
	Contact,
	ContactType,
	ContactStatus,
	useContactList,
	useDeleteContact,
} from "@/queries/contacts";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/queries/auth";

const columns: ColumnDef<Contact>[] = [
	{
		id: "select",
		header: ({ table }: { table: TanstackTable<Contact> }) => (
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
		cell: ({ row }: { row: Row<Contact> }) => (
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
		header: "Name",
		cell: ({ row }: { row: Row<Contact> }) => {
			return <SupplierNameCell contact={row.original} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "companyName",
		header: "Company Name",
		cell: ({ row }: { row: Row<Contact> }) => (
			<div className="text-sm">
				{row.original.companyName || (
					<span className="text-muted-foreground">—</span>
				)}
			</div>
		),
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }: { row: Row<Contact> }) => (
			<div className="text-sm">
				{row.original.email || <span className="text-muted-foreground">—</span>}
			</div>
		),
	},
	{
		accessorKey: "phone",
		header: "Phone",
		cell: ({ row }: { row: Row<Contact> }) => (
			<div className="text-sm">
				{row.original.phone || <span className="text-muted-foreground">—</span>}
			</div>
		),
	},
	{
		accessorKey: "gstin",
		header: "GSTIN",
		cell: ({ row }: { row: Row<Contact> }) => (
			<div className="font-mono text-sm">
				{row.original.gstin || <span className="text-muted-foreground">—</span>}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }: { row: Row<Contact> }) => (
			<Badge
				variant={
					row.original.status === ContactStatus.ACTIVE ? "default" : "secondary"
				}>
				{row.original.status}
			</Badge>
		),
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }: { row: Row<Contact> }) => {
			return <ActionsCell contact={row.original} />;
		},
		enableHiding: false,
	},
];

// Supplier Name Cell Component (clickable to redirect to update page)
function SupplierNameCell({ contact }: { contact: Contact }) {
	const router = useRouter();

	return (
		<Button
			variant="link"
			className="text-foreground w-fit px-0 text-left"
			onClick={() => router.push(`/purchases/suppliers/update/${contact._id}`)}>
			{contact.name}
		</Button>
	);
}

// Actions Cell Component
function ActionsCell({ contact }: { contact: Contact }) {
	const router = useRouter();
	const deleteMutation = useDeleteContact();

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
			<DropdownMenuContent align="end" className="w-32">
				<DropdownMenuItem
					onClick={() =>
						router.push(`/purchases/suppliers/update/${contact._id}`)
					}>
					<Edit className="mr-2 h-4 w-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onClick={() => {
						if (
							confirm(
								`Are you sure you want to delete "${contact.name}"? This will set the contact to inactive.`
							)
						) {
							deleteMutation.mutate(contact._id || "");
						}
					}}>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function SuppliersPage() {
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
	const [statusFilter, setStatusFilter] = React.useState<ContactStatus>(
		ContactStatus.ACTIVE
	);
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const { data, isLoading, error } = useContactList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
		type: ContactType.VENDOR,
		status: statusFilter,
		sort: sorting[0]?.id || "createdAt",
		organizationId: sessionData?.session?.activeOrganizationId,
	});

	const contacts = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		return data.data.docs;
	}, [data]);

	const table = useReactTable({
		data: contacts,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row._id || "",
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
				<p className="text-destructive">Error loading suppliers</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Suppliers" />
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 lg:px-6">
				<div className="flex items-center gap-2 flex-1 w-full md:w-auto">
					<Input
						placeholder="Search suppliers..."
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
							setStatusFilter(value as ContactStatus);
							setPagination({ ...pagination, pageIndex: 0 });
						}}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ContactStatus.ACTIVE}>Active</SelectItem>
							<SelectItem value={ContactStatus.INACTIVE}>Inactive</SelectItem>
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
					<Link href="/purchases/suppliers/create">
						<Button size="sm">
							<Plus />
							<span className="hidden lg:inline">Add Supplier</span>
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
							) : contacts.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center">
										No suppliers found.
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
