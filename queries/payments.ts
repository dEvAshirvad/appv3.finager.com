import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum PaymentStatus {
	RECORDED = "RECORDED",
	REVERSED = "REVERSED",
}

export enum PaymentMethod {
	CASH = "CASH",
	BANK_TRANSFER = "BANK_TRANSFER",
	UPI = "UPI",
	CARD = "CARD",
	CHEQUE = "CHEQUE",
	OTHER = "OTHER",
}

// Types
export interface InvoiceAllocation {
	invoiceId:
		| string
		| {
				_id: string;
				invoiceNumber?: string;
				total?: number;
				paidAmount?: number;
				balance?: number;
				status?: string;
		  };
	invoiceNumber?: string;
	allocatedAmount: number;
	_id?: string;
}

export interface Payment {
	id?: string;
	_id?: string;
	organizationId: string;
	paymentNumber: string;
	contactId: string | { _id: string; name?: string; gstin?: string };
	contactName?: string;
	date: string;
	amount: number;
	paymentMethod: PaymentMethod;
	reference?: string;
	bankAccountId?: string | { _id: string; name?: string; code?: string };
	notes?: string;
	invoiceAllocations?: InvoiceAllocation[];
	totalAllocated: number;
	unallocatedAmount: number;
	journalEntryId?: string;
	reversalJournalEntryId?: string;
	status: PaymentStatus;
	createdAt: string;
	updatedAt: string;
}

// Request Interfaces
export interface CreatePaymentRequest {
	contactId: string;
	date: string;
	amount: number;
	paymentMethod: PaymentMethod;
	reference?: string;
	bankAccountId?: string;
	notes?: string;
	invoiceAllocations?: {
		invoiceId: string;
		allocatedAmount: number;
	}[];
}

export interface UpdatePaymentRequest {
	contactId?: string;
	date?: string;
	amount?: number;
	paymentMethod?: PaymentMethod;
	reference?: string;
	bankAccountId?: string;
	notes?: string;
}

export interface ListPaymentsRequest {
	search?: string;
	contactId?: string;
	paymentMethod?: PaymentMethod;
	fromDate?: string;
	toDate?: string;
	status?: PaymentStatus;
	page?: number;
	limit?: number;
	sort?: string;
}

export interface AllocatePaymentRequest {
	invoiceAllocations: {
		invoiceId: string;
		allocatedAmount: number;
	}[];
}

export interface GetUnallocatedPaymentsRequest {
	contactId: string;
	fromDate?: string;
	toDate?: string;
}

// Response Interfaces
export interface PaymentResponse {
	message: string;
	data: Payment;
	success: boolean;
	status: number;
}

export interface PaymentsListResponse {
	message: string;
	data: {
		docs: Payment[];
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

export interface AllocatePaymentResponse {
	message: string;
	data: Payment;
	success: boolean;
	status: number;
}

export interface UnallocatedPaymentsResponse {
	message: string;
	data: {
		payments: Payment[];
		totalUnallocated: number;
	};
	success: boolean;
	status: number;
}

// Query Keys
export const paymentKeys = {
	all: ["payment"] as const,
	lists: () => [...paymentKeys.all, "list"] as const,
	list: (filters: ListPaymentsRequest) =>
		[...paymentKeys.lists(), filters] as const,
	detail: (id: string) => [...paymentKeys.all, "detail", id] as const,
	unallocated: (filters: GetUnallocatedPaymentsRequest) =>
		[...paymentKeys.all, "unallocated", filters] as const,
};

// API Functions
async function createPayment(
	data: CreatePaymentRequest
): Promise<PaymentResponse> {
	const response = await api.post("/v1/payment", data);
	return response.data;
}

async function getPayment(id: string): Promise<PaymentResponse> {
	const response = await api.get(`/v1/payment/${id}`);
	return response.data;
}

async function listPayments(
	params: ListPaymentsRequest
): Promise<PaymentsListResponse> {
	const response = await api.get("/v1/payment", { params });
	return response.data;
}

async function updatePayment(
	id: string,
	data: UpdatePaymentRequest
): Promise<PaymentResponse> {
	const response = await api.patch(`/v1/payment/${id}`, data);
	return response.data;
}

async function reversePayment(id: string): Promise<PaymentResponse> {
	const response = await api.delete(`/v1/payment/${id}`);
	return response.data;
}

async function allocatePayment(
	id: string,
	data: AllocatePaymentRequest
): Promise<AllocatePaymentResponse> {
	const response = await api.post(`/v1/payment/${id}/allocate`, data);
	return response.data;
}

async function getUnallocatedPayments(
	params: GetUnallocatedPaymentsRequest
): Promise<UnallocatedPaymentsResponse> {
	const response = await api.get("/v1/payment/unallocated", { params });
	return response.data;
}

// React Query Hooks
export function usePaymentList(filters: ListPaymentsRequest = {}) {
	return useQuery({
		queryKey: paymentKeys.list(filters),
		queryFn: () => listPayments(filters),
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000,
	});
}

export function usePayment(id: string | null) {
	return useQuery({
		queryKey: paymentKeys.detail(id || ""),
		queryFn: () => getPayment(id!),
		enabled: !!id,
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
}

export function useUnallocatedPayments(
	filters: GetUnallocatedPaymentsRequest | null
) {
	return useQuery({
		queryKey: paymentKeys.unallocated(filters || { contactId: "" }),
		queryFn: () => getUnallocatedPayments(filters!),
		enabled: !!filters?.contactId,
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
}

export function useCreatePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createPayment,
		onSuccess: () => {
			toast.success("Payment recorded successfully!");
			queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: [...paymentKeys.all, "unallocated"],
			});
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

export function useUpdatePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdatePaymentRequest }) =>
			updatePayment(id, data),
		onSuccess: (_, variables) => {
			toast.success("Payment updated successfully!");
			queryClient.invalidateQueries({
				queryKey: paymentKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update payment"
				);
			}
		},
	});
}

export function useReversePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => reversePayment(id),
		onSuccess: (_, paymentId) => {
			toast.success("Payment reversed successfully!");
			queryClient.invalidateQueries({
				queryKey: paymentKeys.detail(paymentId),
			});
			queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to reverse payment"
				);
			}
		},
	});
}

export function useAllocatePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: AllocatePaymentRequest }) =>
			allocatePayment(id, data),
		onSuccess: (_, variables) => {
			toast.success("Payment allocated successfully!");
			queryClient.invalidateQueries({
				queryKey: paymentKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: [...paymentKeys.all, "unallocated"],
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to allocate payment"
				);
			}
		},
	});
}
