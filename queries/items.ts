"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum ItemType {
	GOODS = "GOODS",
	SERVICE = "SERVICE",
	COMPOSITE = "COMPOSITE",
	NON_INVENTORY = "NON_INVENTORY",
}

export enum TaxPreference {
	TAXABLE = "TAXABLE",
	EXEMPT = "EXEMPT",
	ZERO_RATED = "ZERO_RATED",
}

export enum ItemStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
}

// Types
export interface BOMItem {
	childItemId: string;
	quantity: number;
}

export interface Item {
	_id: string;
	orgId: string;
	code: string;
	name: string;
	type: ItemType;
	unit: string;
	hsnSacCode?: string;
	isTaxable: boolean;
	intraStateTaxRate?: number;
	interStateTaxRate?: number;
	taxPreference: TaxPreference;
	sellable: boolean;
	sellingPrice?: number;
	salesAccountId?: string;
	salesDescription?: string;
	purchasable: boolean;
	costPrice?: number;
	purchaseAccountId?: string;
	purchaseDescription?: string;
	preferredVendorId?: string;
	trackInventory: boolean;
	openingStock?: number;
	openingStockRate?: number;
	openingStockValue?: number;
	inventoryAccountId?: string;
	currentStock: number;
	avgCost: number; // Weighted Average Cost (auto-calculated)
	bom?: BOMItem[];
	imageUrl?: string;
	barcode?: string;
	lowStockAlert?: number;
	nameHindi?: string;
	nameAssamese?: string;
	nameBodo?: string;
	status: ItemStatus;
	createdAt: string;
	updatedAt: string;
}

// Request Types
export interface CreateItemRequest {
	name: string;
	nameHindi?: string;
	orgId: string;
	nameAssamese?: string;
	nameBodo?: string;
	code?: string; // Auto-generated if not provided
	type: ItemType;
	unit: string;
	hsnSacCode?: string;
	isTaxable?: boolean;
	intraStateTaxRate?: number;
	interStateTaxRate?: number;
	taxPreference?: TaxPreference;
	sellable?: boolean;
	sellingPrice?: number;
	salesAccountId?: string;
	salesDescription?: string;
	purchasable?: boolean;
	costPrice?: number;
	purchaseAccountId?: string;
	purchaseDescription?: string;
	preferredVendorId?: string;
	trackInventory?: boolean;
	openingStock?: number;
	openingStockRate?: number;
	inventoryAccountId?: string;
	bom?: BOMItem[];
	imageUrl?: string;
	barcode?: string;
	lowStockAlert?: number;
}

export interface UpdateItemRequest {
	name?: string;
	nameHindi?: string;
	nameAssamese?: string;
	nameBodo?: string;
	code?: string;
	type?: ItemType;
	unit?: string;
	hsnSacCode?: string;
	isTaxable?: boolean;
	intraStateTaxRate?: number;
	interStateTaxRate?: number;
	taxPreference?: TaxPreference;
	sellable?: boolean;
	sellingPrice?: number;
	salesAccountId?: string;
	salesDescription?: string;
	purchasable?: boolean;
	costPrice?: number;
	purchaseAccountId?: string;
	purchaseDescription?: string;
	preferredVendorId?: string;
	trackInventory?: boolean;
	openingStock?: number;
	openingStockRate?: number;
	inventoryAccountId?: string;
	bom?: BOMItem[];
	imageUrl?: string;
	barcode?: string;
	lowStockAlert?: number;
	status?: ItemStatus;
}

export interface ListItemsRequest {
	search?: string;
	type?: ItemType;
	status?: ItemStatus;
	sellable?: boolean;
	purchasable?: boolean;
	trackInventory?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface BatchCreateItemsRequest {
	items: CreateItemRequest[];
}

export interface ItemsListResponse {
	docs: Item[];
	totalDocs: number;
	limit: number;
	page: number;
	totalPages: number;
	nextPage: boolean;
	prevPage: boolean;
}

export interface HSNSuggestRequest {
	query: string;
	limit?: number;
}

export interface HSNSuggestResponse {
	code: string;
	description: string;
	gstRate?: number;
}

// Response Types
export interface CreateItemResponse {
	message: string;
	data: Item;
}

export interface GetItemResponse {
	message: string;
	data: Item;
}

export interface ListItemsResponse {
	message: string;
	data: ItemsListResponse;
}

export interface UpdateItemResponse {
	message: string;
	data: Item;
}

export interface DeleteItemResponse {
	message: string;
	data: {
		_id: string;
		status: ItemStatus;
	};
}

export interface BatchCreateItemsResponse {
	message: string;
	data: {
		created: number;
		failed: number;
		items: Item[];
		errors?: Array<{
			index: number;
			error: string;
		}>;
	};
}

export interface ImportCSVResponse {
	message: string;
	data: {
		imported: number;
		failed: number;
		items: Item[];
		errors?: Array<{
			row: number;
			error: string;
		}>;
	};
}

export interface ExportCSVResponse {
	message: string;
	data: {
		url: string;
		expiresAt: string;
	};
}

export interface HSNSuggestResponseData {
	message: string;
	data: HSNSuggestResponse[];
}

// Stock Report Types
export interface StockReportItem {
	id: string;
	name: string;
	code: string;
	unit: string;
	hsnSacCode?: string;
	currentStock: number;
	avgCost: number;
	totalValue: number;
}

export interface StockReportResponse {
	message: string;
	data: {
		items: StockReportItem[];
		summary: {
			totalItems: number;
			totalStockValue: number;
		};
	};
	success: boolean;
	status: number;
}

// Low Stock Types
export interface LowStockItem {
	id: string;
	name: string;
	code: string;
	unit: string;
	currentStock: number;
	lowStockAlert: number;
	avgCost: number;
	shortage: number;
}

export interface LowStockResponse {
	message: string;
	data: LowStockItem[];
	success: boolean;
	status: number;
}

// Adjust Stock Types
export interface AdjustStockRequest {
	quantity: number;
	reason: string;
}

export interface AdjustStockResponse {
	message: string;
	data: {
		id: string;
		name: string;
		code: string;
		oldStock: number;
		newStock: number;
		adjustment: number;
		avgCost: number;
	};
	success: boolean;
	status: number;
}

// Query Keys
export const itemKeys = {
	all: ["items"] as const,
	lists: () => [...itemKeys.all, "list"] as const,
	list: (filters: ListItemsRequest) => [...itemKeys.lists(), filters] as const,
	details: () => [...itemKeys.all, "detail"] as const,
	detail: (id: string) => [...itemKeys.details(), id] as const,
};

// API Functions
async function createItem(
	data: CreateItemRequest
): Promise<CreateItemResponse> {
	const response = await api.post("/v1/items", data);
	return response.data;
}

async function getItem(id: string): Promise<GetItemResponse> {
	const response = await api.get(`/v1/items/${id}`);
	return response.data;
}

async function listItems(
	params?: ListItemsRequest
): Promise<ListItemsResponse> {
	const response = await api.get("/v1/items", { params });
	return response.data;
}

async function updateItem(
	id: string,
	data: UpdateItemRequest
): Promise<UpdateItemResponse> {
	const response = await api.patch(`/v1/items/${id}`, data);
	return response.data;
}

async function deleteItem(id: string): Promise<DeleteItemResponse> {
	const response = await api.delete(`/v1/items/${id}`);
	return response.data;
}

async function batchCreateItems(
	data: BatchCreateItemsRequest
): Promise<BatchCreateItemsResponse> {
	const response = await api.post("/v1/items/batch", data);
	return response.data;
}

async function importCSV(file: File): Promise<ImportCSVResponse> {
	const formData = new FormData();
	formData.append("file", file);
	const response = await api.post("/v1/items/import/csv", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
	return response.data;
}

async function exportCSV(): Promise<ExportCSVResponse> {
	const response = await api.get("/v1/items/export/csv");
	return response.data;
}

async function suggestHSN(
	params: HSNSuggestRequest
): Promise<HSNSuggestResponseData> {
	const response = await api.get("/v1/items/suggest-hsn", { params });
	return response.data;
}

async function getStockReport(): Promise<StockReportResponse> {
	const response = await api.get("/v1/items/stock-report");
	return response.data;
}

async function getLowStock(): Promise<LowStockResponse> {
	const response = await api.get("/v1/items/low-stock");
	return response.data;
}

async function adjustStock(
	id: string,
	data: AdjustStockRequest
): Promise<AdjustStockResponse> {
	const response = await api.post(`/v1/items/${id}/adjust-stock`, data);
	return response.data;
}

// React Query Hooks
export function useItemsList(filters?: ListItemsRequest) {
	return useQuery({
		queryKey: itemKeys.list(filters || {}),
		queryFn: () => listItems(filters),
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useItem(id: string | null) {
	return useQuery({
		queryKey: itemKeys.detail(id || ""),
		queryFn: () => getItem(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCreateItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createItem,
		onSuccess: () => {
			toast.success("Item created successfully!");
			queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to create item");
			}
		},
	});
}

export function useUpdateItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateItemRequest }) =>
			updateItem(id, data),
		onSuccess: (_, variables) => {
			toast.success("Item updated successfully!");
			queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: itemKeys.detail(variables.id),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to update item");
			}
		},
	});
}

export function useDeleteItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteItem,
		onSuccess: () => {
			toast.success("Item deleted successfully!");
			queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to delete item");
			}
		},
	});
}

export function useBatchCreateItems() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: batchCreateItems,
		onSuccess: (data) => {
			if (data.data.failed > 0) {
				toast.warning(
					`${data.data.created} items created, ${data.data.failed} failed`
				);
			} else {
				toast.success(`${data.data.created} items created successfully!`);
			}
			queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to create items");
			}
		},
	});
}

export function useImportCSV() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: importCSV,
		onSuccess: (data) => {
			if (data.data.failed > 0) {
				toast.warning(
					`${data.data.imported} items imported, ${data.data.failed} failed`
				);
			} else {
				toast.success(`${data.data.imported} items imported successfully!`);
			}
			queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to import items");
			}
		},
	});
}

export function useExportCSV() {
	return useMutation({
		mutationFn: exportCSV,
		onSuccess: (data) => {
			toast.success("Export generated successfully!");
			// Open download link
			window.open(data.data.url, "_blank");
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to export items");
			}
		},
	});
}

export function useSuggestHSN(query: string, limit = 10) {
	return useQuery({
		queryKey: ["items", "suggest-hsn", query, limit],
		queryFn: () => suggestHSN({ query, limit }),
		enabled: query.length >= 2, // Only search if query is at least 2 characters
		staleTime: 5 * 60 * 1000, // 5 minutes (HSN codes don't change often)
		gcTime: 30 * 60 * 1000, // 30 minutes
	});
}

export function useStockReport() {
	return useQuery({
		queryKey: [...itemKeys.all, "stock-report"],
		queryFn: getStockReport,
		staleTime: 1 * 60 * 1000, // 1 minute (real-time stock data)
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
}

export function useLowStock() {
	return useQuery({
		queryKey: [...itemKeys.all, "low-stock"],
		queryFn: getLowStock,
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
}

export function useAdjustStock() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: AdjustStockRequest }) =>
			adjustStock(id, data),
		onSuccess: (_, variables) => {
			toast.success("Stock adjusted successfully!");
			queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: itemKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: [...itemKeys.all, "stock-report"],
			});
			queryClient.invalidateQueries({
				queryKey: [...itemKeys.all, "low-stock"],
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to adjust stock");
			}
		},
	});
}
