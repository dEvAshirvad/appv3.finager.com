import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum BillStatus {
	DRAFT = "DRAFT",
	RECEIVED = "RECEIVED",
	PAID = "PAID",
	PARTIALLY_PAID = "PARTIALLY_PAID",
	CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
	CASH = "CASH",
	CREDIT = "CREDIT",
	BANK_TRANSFER = "BANK_TRANSFER",
	UPI = "UPI",
	CARD = "CARD",
}

// Types
export interface Address {
	street?: string;
	city?: string;
	state?: string;
	pincode?: string;
	country?: string;
}

export interface BillLineItem {
	itemId: string | { _id: string; name?: string; code?: string; unit?: string };
	itemName?: string;
	itemCode?: string;
	description?: string;
	quantity: number;
	unit: string;
	unitPrice: number;
	discount?: number;
	taxRate?: number;
	taxableAmount: number;
	taxAmount?: number;
	lineTotal: number;
	hsnSacCode?: string;
}

export interface Bill {
	id?: string;
	_id?: string;
	organizationId: string;
	billNumber: string;
	contactId: string | { _id: string; name?: string; gstin?: string };
	contactName?: string;
	contactGstin?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
	date: string;
	dueDate?: string;
	reference?: string;
	lineItems: BillLineItem[];
	subtotal: number;
	discount?: number;
	taxAmount: number;
	cgstAmount?: number;
	sgstAmount?: number;
	igstAmount?: number;
	total: number;
	paidAmount: number;
	balance: number;
	paymentMethod: PaymentMethod;
	notes?: string;
	terms?: string;
	journalEntryId?: string;
	status: BillStatus;
	createdAt: string;
	updatedAt: string;
}

// Request Interfaces
export interface CreateBillRequest {
	contactId: string;
	date: string;
	dueDate?: string;
	reference?: string;
	paymentMethod?: PaymentMethod;
	lineItems: {
		itemId: string;
		quantity: number;
		unitPrice: number;
		discount?: number;
		description?: string;
	}[];
	discount?: number;
	notes?: string;
	terms?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
}

export interface UpdateBillRequest {
	contactId?: string;
	date?: string;
	dueDate?: string;
	reference?: string;
	paymentMethod?: PaymentMethod;
	lineItems?: {
		itemId: string;
		quantity: number;
		unitPrice: number;
		discount?: number;
		description?: string;
	}[];
	discount?: number;
	notes?: string;
	terms?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
}

export interface ListBillsRequest {
	search?: string;
	contactId?: string;
	status?: BillStatus;
	fromDate?: string;
	toDate?: string;
	page?: number;
	limit?: number;
	sort?: string;
}

export interface RecordPaymentRequest {
	amount: number;
	paymentMethod: PaymentMethod;
}

// Response Interfaces
export interface BillResponse {
	message: string;
	data: Bill;
	success: boolean;
	status: number;
}

export interface BillsListResponse {
	message: string;
	data: {
		docs: Bill[];
		totalDocs: number;
		limit: number;
		page: number;
		totalPages: number;
		nextPage: boolean;
		prevPage: boolean;
	};
	success: boolean;
	status: number;
}

export interface PostBillResponse {
	message: string;
	data: Bill;
	success: boolean;
	status: number;
}

export interface RecordPaymentResponse {
	message: string;
	data: Bill;
	success: boolean;
	status: number;
}

// Query Keys
export const billKeys = {
	all: ["bill"] as const,
	lists: () => [...billKeys.all, "list"] as const,
	list: (filters: ListBillsRequest) => [...billKeys.lists(), filters] as const,
	detail: (id: string) => [...billKeys.all, "detail", id] as const,
};

// API Functions
async function createBill(data: CreateBillRequest): Promise<BillResponse> {
	const response = await api.post("/v1/bill", data);
	return response.data;
}

async function getBill(id: string): Promise<BillResponse> {
	const response = await api.get(`/v1/bill/${id}`);
	return response.data;
}

async function listBills(params: ListBillsRequest): Promise<BillsListResponse> {
	const response = await api.get("/v1/bill", { params });
	return response.data;
}

async function updateBill(
	id: string,
	data: UpdateBillRequest
): Promise<BillResponse> {
	const response = await api.patch(`/v1/bill/${id}`, data);
	return response.data;
}

async function deleteBill(id: string): Promise<{ success: boolean; message: string }> {
	const response = await api.delete(`/v1/bill/${id}`);
	return response.data;
}

async function postBill(id: string): Promise<PostBillResponse> {
	const response = await api.post(`/v1/bill/${id}/post`);
	return response.data;
}

async function recordPayment(
	id: string,
	data: RecordPaymentRequest
): Promise<RecordPaymentResponse> {
	const response = await api.post(`/v1/bill/${id}/payment`, data);
	return response.data;
}

// React Query Hooks
export function useBillList(filters: ListBillsRequest = {}) {
	return useQuery({
		queryKey: billKeys.list(filters),
		queryFn: () => listBills(filters),
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000,
	});
}

export function useBill(id: string | null) {
	return useQuery({
		queryKey: billKeys.detail(id || ""),
		queryFn: () => getBill(id!),
		enabled: !!id,
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
}

export function useCreateBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBill,
		onSuccess: () => {
			toast.success("Bill created successfully!");
			queryClient.invalidateQueries({ queryKey: billKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to create bill"
				);
			}
		},
	});
}

export function useUpdateBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateBillRequest }) =>
			updateBill(id, data),
		onSuccess: (_, variables) => {
			toast.success("Bill updated successfully!");
			queryClient.invalidateQueries({
				queryKey: billKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: billKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update bill"
				);
			}
		},
	});
}

export function useDeleteBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteBill,
		onSuccess: () => {
			toast.success("Bill cancelled successfully!");
			queryClient.invalidateQueries({ queryKey: billKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to cancel bill"
				);
			}
		},
	});
}

export function usePostBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => postBill(id),
		onSuccess: (_, billId) => {
			toast.success("Bill posted successfully!");
			queryClient.invalidateQueries({
				queryKey: billKeys.detail(billId),
			});
			queryClient.invalidateQueries({ queryKey: billKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to post bill"
				);
			}
		},
	});
}

export function useRecordPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: RecordPaymentRequest;
		}) => recordPayment(id, data),
		onSuccess: (_, variables) => {
			toast.success("Payment recorded successfully!");
			queryClient.invalidateQueries({
				queryKey: billKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: billKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to record payment"
				);
			}
		},
	});
}

