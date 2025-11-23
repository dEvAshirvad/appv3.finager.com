"use client";

import * as React from "react";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	CheckCircle2,
	MoreVertical,
	LayoutGrid,
	Loader2,
	Plus,
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
import { toast } from "sonner";
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
	DrawerFooter,
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import DashTitle from "@/components/header/dash-title";
import {
	Item,
	ItemType,
	ItemStatus,
	useItemsList,
	useUpdateItem,
	useDeleteItem,
} from "@/queries/items";
import { useIsMobile } from "@/hooks/use-mobile";

const columns: ColumnDef<Item>[] = [
	{
		id: "select",
		header: ({ table }: { table: TanstackTable<Item> }) => (
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
		cell: ({ row }: { row: Row<Item> }) => (
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
		cell: ({ row }) => {
			return <TableCellViewer item={row.original} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "code",
		header: "Code",
		cell: ({ row }: { row: Row<Item> }) => (
			<div className="w-32">
				<Badge variant="outline" className="text-muted-foreground px-1.5">
					{row.original.code}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "type",
		header: "Type",
		cell: ({ row }: { row: Row<Item> }) => (
			<Badge variant="outline" className="text-muted-foreground px-1.5">
				{row.original.type}
			</Badge>
		),
	},
	{
		accessorKey: "unit",
		header: "Unit",
		cell: ({ row }: { row: Row<Item> }) => (
			<div className="text-sm text-muted-foreground">{row.original.unit}</div>
		),
	},
	{
		accessorKey: "sellingPrice",
		header: "Selling Price",
		cell: ({ row }: { row: Row<Item> }) => (
			<div className="text-sm">
				{row.original.sellingPrice
					? `₹${row.original.sellingPrice.toLocaleString()}`
					: "-"}
			</div>
		),
	},
	{
		accessorKey: "costPrice",
		header: "Cost Price",
		cell: ({ row }: { row: Row<Item> }) => (
			<div className="text-sm">
				{row.original.costPrice
					? `₹${row.original.costPrice.toLocaleString()}`
					: "-"}
			</div>
		),
	},
	{
		accessorKey: "currentStock",
		header: "Stock",
		cell: ({ row }: { row: Row<Item> }) => (
			<div className="text-sm">
				{row.original.trackInventory
					? row.original.currentStock.toLocaleString()
					: "-"}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }: { row: Row<Item> }) => (
			<Badge
				variant={
					row.original.status === ItemStatus.ACTIVE ? "default" : "secondary"
				}
				className="px-1.5">
				{row.original.status === ItemStatus.ACTIVE ? (
					<CheckCircle2 className="fill-green-500 dark:fill-green-400 size-3 mr-1" />
				) : null}
				{row.original.status}
			</Badge>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => {
			return <ActionsCell item={row.original} />;
		},
	},
];

// Actions cell component
function ActionsCell({ item }: { item: Item }) {
	const deleteMutation = useDeleteItem();
	const router = useRouter();

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
					onClick={() => router.push(`/items/update/${item._id}`)}>
					Edit
				</DropdownMenuItem>
				<DropdownMenuItem>Make a copy</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onClick={() => {
						if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
							deleteMutation.mutate(item._id);
						}
					}}>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function TableCellViewer({ item }: { item: Item }) {
	const isMobile = useIsMobile();
	const updateMutation = useUpdateItem();
	const [status, setStatus] = React.useState(item.status);

	return (
		<Drawer direction={isMobile ? "bottom" : "right"}>
			<DrawerTrigger asChild>
				<Button variant="link" className="text-foreground w-fit px-0 text-left">
					{item.name}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>{item.name}</DrawerTitle>
					<DrawerDescription>Item details and settings</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<form
						className="flex flex-col gap-4"
						onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							updateMutation.mutate(
								{
									id: item._id,
									data: {
										name: formData.get("name") as string,
										sellingPrice: formData.get("sellingPrice")
											? Number(formData.get("sellingPrice"))
											: undefined,
										costPrice: formData.get("costPrice")
											? Number(formData.get("costPrice"))
											: undefined,
										status: status,
									},
								},
								{
									onSuccess: () => {
										toast.success("Item updated successfully!");
									},
								}
							);
						}}>
						<div className="flex flex-col gap-3">
							<Label htmlFor="name">Name</Label>
							<Input id="name" name="name" defaultValue={item.name} required />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="sellingPrice">Selling Price</Label>
							<Input
								id="sellingPrice"
								name="sellingPrice"
								type="number"
								defaultValue={item.sellingPrice || ""}
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="costPrice">Cost Price</Label>
							<Input
								id="costPrice"
								name="costPrice"
								type="number"
								defaultValue={item.costPrice || ""}
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="status">Status</Label>
							<Select
								value={status}
								onValueChange={(value) => setStatus(value as ItemStatus)}>
								<SelectTrigger id="status" className="w-full">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ItemStatus.ACTIVE}>Active</SelectItem>
									<SelectItem value={ItemStatus.INACTIVE}>Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DrawerFooter>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</Button>
							<DrawerClose asChild>
								<Button variant="outline">Cancel</Button>
							</DrawerClose>
						</DrawerFooter>
					</form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

export function ItemsTable() {
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
	const [typeFilter, setTypeFilter] = React.useState<string>("all");

	const { data, isLoading, error } = useItemsList({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: searchQuery || undefined,
		type: typeFilter !== "all" ? (typeFilter as ItemType) : undefined,
		sortBy: sorting[0]?.id || "createdAt",
		sortOrder: sorting[0]?.desc ? "desc" : "asc",
	});

	const items = React.useMemo(() => {
		if (!data?.data?.docs || !Array.isArray(data.data.docs)) return [];
		return data.data.docs;
	}, [data]);

	const table = useReactTable({
		data: items,
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
				<p className="text-destructive">Error loading items</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashTitle title="Items" />
			<Tabs
				defaultValue="outline"
				className="w-full flex-col justify-start gap-6">
				<div className="flex items-center justify-between px-4 lg:px-6">
					<div className="flex items-center gap-2 flex-1">
						<Input
							placeholder="Search items..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPagination({ ...pagination, pageIndex: 0 });
							}}
							className="max-w-sm"
						/>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Filter by type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value={ItemType.GOODS}>Goods</SelectItem>
								<SelectItem value={ItemType.SERVICE}>Service</SelectItem>
								<SelectItem value={ItemType.COMPOSITE}>Composite</SelectItem>
								<SelectItem value={ItemType.NON_INVENTORY}>
									Non-Inventory
								</SelectItem>
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
						<Link href="/items/create">
							<Button variant="outline" size="sm">
								<Plus />
								<span className="hidden lg:inline">Add Item</span>
							</Button>
						</Link>
					</div>
				</div>
				<TabsContent
					value="outline"
					className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
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
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ItemsPage() {
	return <ItemsTable />;
}

export default ItemsPage;
