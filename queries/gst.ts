"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum GSTAuthStatus {
	PENDING = "PENDING",
	AUTHENTICATED = "AUTHENTICATED",
	EXPIRED = "EXPIRED",
	FAILED = "FAILED",
}

// Types
export interface GSTAuthToken {
	authToken: string;
	sek?: string;
	expiry: string;
	txn?: string;
}

export interface GST {
	id: string;
	organizationId: string;
	gstin: string;
	email: string;
	stateCd: string;
	ipAddress?: string;
	authStatus: GSTAuthStatus;
	authToken?: GSTAuthToken;
	lastReconciliationDate?: string;
	lastReconciliationPeriod?: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

// Request Types
export interface CreateGSTRequest {
	gstin: string;
	organizationId: string;
	email: string;
	stateCd: string;
	ipAddress?: string;
}

export interface AuthenticateGSTRequest {
	otp: string;
	txn: string;
}

export interface ReconcileGSTRequest {
	retPeriod: string;
	fy: string;
	booksData: Array<{
		invoiceNo: string;
		supplierGstin: string;
		date: string;
		taxableValue: number;
		cgst: number;
		sgst: number;
		igst: number;
		total: number;
	}>;
	fetch2A?: boolean;
}

export interface UpdateGSTRequest {
	email?: string;
	stateCd?: string;
	ipAddress?: string;
}

export interface ListGSTRequest {
	page?: number;
	limit?: number;
}

// Response Types
export interface GSTResponse {
	message: string;
	data: GST;
	success: boolean;
	status: number;
}

export interface GSTListResponse {
	message: string;
	data: {
		docs: GST[];
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

export interface OTPResponse {
	message: string;
	data: {
		success: boolean;
		txn: string;
		message: string;
	};
	success: boolean;
	status: number;
}

// WhiteBooks API Format
export interface GSTR3BSummary {
	gstin: string;
	ret_period: string;
	liability: {
		cgst: number;
		sgst: number;
		igst: number;
		cess: number;
		total: number;
	};
	itc: {
		cgst: number;
		sgst: number;
		igst: number;
		total_eligible: number;
	};
	net_payable: number;
	late_fee: number;
	status: string;
}

// Zoho Books Format
export interface GSTR3BBooksFormat {
	description: string;
	period: {
		from: string;
		to: string;
	};
	section3_1: {
		title: string;
		rows: Array<{
			nature: string;
			taxableValue: number;
			integratedTax: number;
			centralTax: number;
			stateTax: number;
			cessTax: number;
		}>;
		total: {
			taxableValue: number;
			integratedTax: number;
			centralTax: number;
			stateTax: number;
			cessTax: number;
		};
	};
	section4: {
		title: string;
		rows: Array<{
			detail: string;
			integratedTax: number;
			centralTax: number;
			stateTax: number;
			cessTax: number;
		}>;
		total: {
			integratedTax: number;
			centralTax: number;
			stateTax: number;
			cessTax: number;
		};
	};
	summary: {
		totalLiability: number;
		totalITC: number;
		netPayable: number;
		lateFee: number;
	};
}

// WhiteBooks API Format
export interface GSTR1Summary {
	total_invoices: number;
	b2b: {
		count: number;
		value: number;
		tax: number;
	};
	b2c: {
		count: number;
		value: number;
		tax: number;
	};
	hsn_summary: Array<{
		hsn: string;
		desc: string;
		qty: number;
		value: number;
		tax: number;
	}>;
	total_taxable: number;
	total_tax: number;
}

// Zoho Books Format
export interface GSTR1BooksFormat {
	description: string;
	period: {
		from: string;
		to: string;
	};
	summary: Array<{
		description: string;
		igstAmount: number;
		cgstAmount: number;
		sgstAmount: number;
		taxableAmount: number;
		invoiceTotal: number;
	}>;
	hsnSummary: {
		b2b: Array<{
			hsn: string;
			description: string;
			qty: number;
			taxable: number;
			igst: number;
			cgst: number;
			sgst: number;
			total: number;
		}>;
		b2c: Array<{
			hsn: string;
			description: string;
			qty: number;
			taxable: number;
			igst: number;
			cgst: number;
			sgst: number;
			total: number;
		}>;
	};
}

// WhiteBooks API Format
export interface GSTR2Summary {
	total_suppliers: number;
	b2b_invoices: number;
	total_taxable_value: number;
	total_itc: {
		cgst: number;
		sgst: number;
		igst: number;
		cess: number;
	};
	mismatched_invoices: number;
	missing_in_books: number;
}

// Zoho Books Format
export interface GSTR2BooksFormat {
	description: string;
	period: {
		from: string;
		to: string;
	};
	summary: Array<{
		description: string;
		igstAmount: number;
		cgstAmount: number;
		sgstAmount: number;
		billTotal: number;
	}>;
	hsnSummary: Array<{
		hsn: string;
		description: string;
		qty: number;
		taxable: number;
		igst: number;
		cgst: number;
		sgst: number;
		total: number;
	}>;
}

export interface ReconciliationJournal {
	date: string;
	narration: string;
	entries: Array<{
		account: string;
		debit: number;
		credit: number;
	}>;
}

export interface ReconciliationResult {
	total_in_books: number;
	total_in_2a: number;
	fully_matched: number;
	partially_matched: number;
	missing_in_2a: number;
	missing_in_books: number;
	itc_lost_due_to_mismatch: number;
	suggested_journals: ReconciliationJournal[];
}

export interface GSTR3BResponse {
	message: string;
	data: GSTR3BSummary | GSTR3BBooksFormat;
	success: boolean;
	status: number;
}

export interface GSTR1Response {
	message: string;
	data: GSTR1Summary | GSTR1BooksFormat;
	success: boolean;
	status: number;
}

export interface GSTR2Response {
	message: string;
	data: GSTR2Summary | GSTR2BooksFormat;
	success: boolean;
	status: number;
}

// Type guards to check format
export function isGSTR3BBooksFormat(
	data: GSTR3BSummary | GSTR3BBooksFormat
): data is GSTR3BBooksFormat {
	return "section3_1" in data;
}

export function isGSTR1BooksFormat(
	data: GSTR1Summary | GSTR1BooksFormat
): data is GSTR1BooksFormat {
	return "summary" in data && Array.isArray(data.summary);
}

export function isGSTR2BooksFormat(
	data: GSTR2Summary | GSTR2BooksFormat
): data is GSTR2BooksFormat {
	return "summary" in data && Array.isArray(data.summary);
}

export interface ReconcileGSTResponse {
	message: string;
	data: {
		success: boolean;
		reconciliation: ReconciliationResult;
	};
	success: boolean;
	status: number;
}

export interface GSTAuthStatusResponse {
	message: string;
	data: {
		authenticated: boolean;
		authStatus: GSTAuthStatus;
		tokenExpiry: string | null;
		tokenExpired: boolean;
		needsRefresh: boolean;
	};
	success: boolean;
	status: number;
}

// Query Keys
export const gstKeys = {
	all: ["gst"] as const,
	lists: () => [...gstKeys.all, "list"] as const,
	list: (filters: ListGSTRequest) => [...gstKeys.lists(), filters] as const,
	detail: (id: string) => [...gstKeys.all, "detail", id] as const,
	authStatus: (id: string) => [...gstKeys.detail(id), "auth-status"] as const,
	gstr3b: (id: string, retPeriod: string, fy: string) =>
		[...gstKeys.detail(id), "gstr3b", retPeriod, fy] as const,
	gstr1: (id: string, retPeriod: string, fy: string) =>
		[...gstKeys.detail(id), "gstr1", retPeriod, fy] as const,
	gstr2: (id: string, retPeriod: string, fy: string) =>
		[...gstKeys.detail(id), "gstr2", retPeriod, fy] as const,
	reconcile: (id: string) => [...gstKeys.detail(id), "reconcile"] as const,
};

// API Functions
async function createGST(data: CreateGSTRequest): Promise<GSTResponse> {
	const response = await api.post("/v1/gst", data);
	return response.data;
}

async function getGST(id: string): Promise<GSTResponse> {
	const response = await api.get(`/v1/gst/${id}`);
	return response.data;
}

async function listGST(params: ListGSTRequest): Promise<GSTListResponse> {
	const response = await api.get("/v1/gst", { params });
	return response.data;
}

async function updateGST(
	id: string,
	data: UpdateGSTRequest
): Promise<GSTResponse> {
	const response = await api.patch(`/v1/gst/${id}`, data);
	return response.data;
}

async function deleteGST(
	id: string
): Promise<{ message: string; success: boolean; status: number }> {
	const response = await api.delete(`/v1/gst/${id}`);
	return response.data;
}

async function requestOTP(id: string): Promise<OTPResponse> {
	const response = await api.post(`/v1/gst/${id}/otp`);
	return response.data;
}

async function authenticateGST(
	id: string,
	data: AuthenticateGSTRequest
): Promise<GSTResponse> {
	const response = await api.post(`/v1/gst/${id}/authenticate`, data);
	return response.data;
}

async function getGSTR3B(
	id: string,
	retPeriod: string,
	fy: string,
	fromDate?: string,
	toDate?: string
): Promise<GSTR3BResponse> {
	const params: Record<string, string> = { retPeriod, fy };
	if (fromDate) params.fromDate = fromDate;
	if (toDate) params.toDate = toDate;
	const response = await api.get(`/v1/gst/${id}/gstr3b`, { params });
	return response.data;
}

async function getGSTR1(
	id: string,
	retPeriod: string,
	fy: string,
	fromDate?: string,
	toDate?: string
): Promise<GSTR1Response> {
	const params: Record<string, string> = { retPeriod, fy };
	if (fromDate) params.fromDate = fromDate;
	if (toDate) params.toDate = toDate;
	const response = await api.get(`/v1/gst/${id}/gstr1`, { params });
	return response.data;
}

async function getGSTR2(
	id: string,
	retPeriod: string,
	fy: string,
	fromDate?: string,
	toDate?: string
): Promise<GSTR2Response> {
	const params: Record<string, string> = { retPeriod, fy };
	if (fromDate) params.fromDate = fromDate;
	if (toDate) params.toDate = toDate;
	const response = await api.get(`/v1/gst/${id}/gstr2`, { params });
	return response.data;
}

async function reconcileGST(
	id: string,
	data: ReconcileGSTRequest
): Promise<ReconcileGSTResponse> {
	const response = await api.post(`/v1/gst/${id}/reconcile`, data);
	return response.data;
}

async function getGSTAuthStatus(id: string): Promise<GSTAuthStatusResponse> {
	const response = await api.get(`/v1/gst/${id}/auth-status`);
	return response.data;
}

// React Query Hooks
export function useGSTList(filters?: ListGSTRequest) {
	return useQuery({
		queryKey: gstKeys.list(filters || {}),
		queryFn: () => listGST(filters || {}),
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useGST(id: string | null) {
	return useQuery({
		queryKey: gstKeys.detail(id || ""),
		queryFn: () => getGST(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCreateGST() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createGST,
		onSuccess: () => {
			toast.success("GST credentials created successfully!");
			queryClient.invalidateQueries({ queryKey: gstKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to create GST credentials"
				);
			}
		},
	});
}

export function useUpdateGST() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateGSTRequest }) =>
			updateGST(id, data),
		onSuccess: (_, variables) => {
			toast.success("GST record updated successfully!");
			queryClient.invalidateQueries({ queryKey: gstKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: gstKeys.detail(variables.id),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update GST record"
				);
			}
		},
	});
}

export function useDeleteGST() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteGST,
		onSuccess: () => {
			toast.success("GST record deleted successfully!");
			queryClient.invalidateQueries({ queryKey: gstKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to delete GST record"
				);
			}
		},
	});
}

export function useRequestOTP() {
	return useMutation({
		mutationFn: requestOTP,
		onSuccess: () => {
			toast.success("OTP sent successfully! Check your email.");
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to send OTP");
			}
		},
	});
}

export function useAuthenticateGST() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: AuthenticateGSTRequest }) =>
			authenticateGST(id, data),
		onSuccess: (_, variables) => {
			toast.success("GST authenticated successfully!");
			queryClient.invalidateQueries({
				queryKey: gstKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: gstKeys.authStatus(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: gstKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to authenticate GST"
				);
			}
		},
	});
}

export function useGSTR3B(
	id: string | null,
	retPeriod: string | null,
	fy: string | null,
	fromDate?: string | null,
	toDate?: string | null
) {
	return useQuery({
		queryKey: [
			...gstKeys.gstr3b(id || "", retPeriod || "", fy || ""),
			fromDate,
			toDate,
		],
		queryFn: () =>
			getGSTR3B(
				id!,
				retPeriod!,
				fy!,
				fromDate || undefined,
				toDate || undefined
			),
		enabled: !!id && !!retPeriod && !!fy,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useGSTR1(
	id: string | null,
	retPeriod: string | null,
	fy: string | null,
	fromDate?: string | null,
	toDate?: string | null
) {
	return useQuery({
		queryKey: [
			...gstKeys.gstr1(id || "", retPeriod || "", fy || ""),
			fromDate,
			toDate,
		],
		queryFn: () =>
			getGSTR1(
				id!,
				retPeriod!,
				fy!,
				fromDate || undefined,
				toDate || undefined
			),
		enabled: !!id && !!retPeriod && !!fy,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useGSTR2(
	id: string | null,
	retPeriod: string | null,
	fy: string | null,
	fromDate?: string | null,
	toDate?: string | null
) {
	return useQuery({
		queryKey: [
			...gstKeys.gstr2(id || "", retPeriod || "", fy || ""),
			fromDate,
			toDate,
		],
		queryFn: () =>
			getGSTR2(
				id!,
				retPeriod!,
				fy!,
				fromDate || undefined,
				toDate || undefined
			),
		enabled: !!id && !!retPeriod && !!fy,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useReconcileGST() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ReconcileGSTRequest }) =>
			reconcileGST(id, data),
		onSuccess: (_, variables) => {
			toast.success("GST reconciliation completed successfully!");
			queryClient.invalidateQueries({
				queryKey: gstKeys.detail(variables.id),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to reconcile GST");
			}
		},
	});
}

export function useGSTAuthStatus(id: string | null) {
	return useQuery({
		queryKey: gstKeys.authStatus(id || ""),
		queryFn: () => getGSTAuthStatus(id!),
		enabled: !!id,
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,
		refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to check token status
	});
}
