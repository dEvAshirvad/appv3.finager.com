"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum InvoiceStatus {
	DRAFT = "DRAFT",
	SENT = "SENT",
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

export interface LineItem {
	itemId: string | { _id: string; name: string; code: string; unit: string };
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

export interface Invoice {
	id: string;
	_id: string;
	organizationId: string;
	invoiceNumber: string;
	contactId: string | { _id: string; name: string; gstin?: string };
	contactName?: string;
	contactGstin?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
	date: string;
	dueDate?: string;
	reference?: string;
	lineItems: LineItem[];
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
	status: InvoiceStatus;
	createdAt: string;
	updatedAt: string;
}

// Request Types
export interface CreateInvoiceRequest {
	contactId: string;
	date: string;
	dueDate?: string;
	reference?: string;
	paymentMethod?: PaymentMethod;
	lineItems: Array<{
		itemId: string;
		unit: string;
		quantity: number;
		unitPrice: number;
		discount?: number;
		description?: string;
		taxRate?: number;
		taxableAmount?: number;
		taxAmount?: number;
		lineTotal?: number;
		hsnSacCode?: string;
	}>;
	discount?: number;
	notes?: string;
	terms?: string;
	organizationId?: string;
}

export interface UpdateInvoiceRequest {
	contactId?: string;
	date?: string;
	dueDate?: string;
	reference?: string;
	paymentMethod?: PaymentMethod;
	lineItems?: Array<{
		itemId: string;
		quantity: number;
		unitPrice: number;
		discount?: number;
		description?: string;
	}>;
	discount?: number;
	notes?: string;
	terms?: string;
}

export interface ListInvoicesRequest {
	search?: string;
	contactId?: string;
	status?: InvoiceStatus;
	fromDate?: string;
	toDate?: string;
	page?: number;
	limit?: number;
	sort?: string;
	organizationId?: string;
}

export interface RecordPaymentRequest {
	amount: number;
	paymentMethod: PaymentMethod;
}

// Response Types
export interface InvoiceResponse {
	message: string;
	data: Invoice;
	success: boolean;
	status: number;
}

export interface InvoicesListResponse {
	message: string;
	data: {
		docs: Invoice[];
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

export interface PostInvoiceResponse {
	message: string;
	data: Invoice;
	success: boolean;
	status: number;
}

export interface PaymentResponse {
	message: string;
	data: Invoice;
	success: boolean;
	status: number;
}

// Query Keys
export const invoiceKeys = {
	all: ["invoices"] as const,
	lists: () => [...invoiceKeys.all, "list"] as const,
	list: (filters: ListInvoicesRequest) =>
		[...invoiceKeys.lists(), filters] as const,
	detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

// API Functions
async function createInvoice(
	data: CreateInvoiceRequest
): Promise<InvoiceResponse> {
	const response = await api.post("/v1/invoice", data);
	return response.data;
}

async function getInvoice(id: string): Promise<InvoiceResponse> {
	const response = await api.get(`/v1/invoice/${id}`);
	return response.data;
}

async function listInvoices(
	params: ListInvoicesRequest
): Promise<InvoicesListResponse> {
	const response = await api.get("/v1/invoice", { params });
	return response.data;
}

async function updateInvoice(
	id: string,
	data: UpdateInvoiceRequest
): Promise<InvoiceResponse> {
	const response = await api.patch(`/v1/invoice/${id}`, data);
	return response.data;
}

async function deleteInvoice(id: string): Promise<InvoiceResponse> {
	const response = await api.delete(`/v1/invoice/${id}`);
	return response.data;
}

async function postInvoice(id: string): Promise<PostInvoiceResponse> {
	const response = await api.post(`/v1/invoice/${id}/post`);
	return response.data;
}

async function recordPayment(
	id: string,
	data: RecordPaymentRequest
): Promise<PaymentResponse> {
	const response = await api.post(`/v1/invoice/${id}/payment`, data);
	return response.data;
}

// React Query Hooks
export function useInvoiceList(filters?: ListInvoicesRequest) {
	return useQuery({
		queryKey: invoiceKeys.list(filters || {}),
		queryFn: () => listInvoices(filters || {}),
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useInvoice(id: string | null) {
	return useQuery({
		queryKey: invoiceKeys.detail(id || ""),
		queryFn: () => getInvoice(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCreateInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createInvoice,
		onSuccess: () => {
			toast.success("Invoice created successfully!");
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to create invoice"
				);
			}
		},
	});
}

export function useUpdateInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) =>
			updateInvoice(id, data),
		onSuccess: (_, variables) => {
			toast.success("Invoice updated successfully!");
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: invoiceKeys.detail(variables.id),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update invoice"
				);
			}
		},
	});
}

export function useDeleteInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteInvoice,
		onSuccess: () => {
			toast.success("Invoice cancelled successfully!");
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to cancel invoice"
				);
			}
		},
	});
}

export function usePostInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: postInvoice,
		onSuccess: (_, invoiceId) => {
			toast.success("Invoice posted successfully!");
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: invoiceKeys.detail(invoiceId),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to post invoice");
			}
		},
	});
}

export function useRecordPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: RecordPaymentRequest }) =>
			recordPayment(id, data),
		onSuccess: (_, variables) => {
			toast.success("Payment recorded successfully!");
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: invoiceKeys.detail(variables.id),
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
