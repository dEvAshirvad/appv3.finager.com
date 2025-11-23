"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum JournalStatus {
	DRAFT = "draft",
	POSTED = "posted",
	REVERSED = "reversed",
}

export enum TransactionType {
	DEBIT = "debit",
	CREDIT = "credit",
}

// Types
export interface Transaction {
	amount: number;
	type: TransactionType;
	accountId: string;
	description?: string;
}

export interface JournalEntry {
	_id: string;
	organizationId: string;
	name: string;
	description?: string;
	date: string;
	reference?: string;
	transactions: Transaction[];
	status: JournalStatus;
	createdBy: string;
	updatedBy: string;
	createdAt: string;
	updatedAt: string;
}

// Request Types
export interface CreateJournalRequest {
	organizationId?: string;
	name: string;
	description?: string;
	date: string;
	reference?: string;
	transactions: Transaction[];
}

export interface UpdateJournalRequest {
	name?: string;
	description?: string;
	date?: string;
	reference?: string;
	transactions?: Transaction[];
	status?: JournalStatus;
}

export interface ListJournalRequest {
	page?: number;
	limit?: number;
	search?: string;
	sort?: string;
	status?: JournalStatus;
	organizationId?: string;
	startDate?: string;
	endDate?: string;
}

export interface ValidateJournalRequest {
	organizationId?: string;
	transactions: Transaction[];
}

// Response Types
export interface CreateJournalResponse {
	message: string;
	data: JournalEntry;
}

export interface GetJournalResponse {
	message: string;
	data: JournalEntry;
}

export interface ListJournalResponse {
	message: string;
	data: {
		docs: JournalEntry[];
		totalDocs: number;
		limit: number;
		page: number;
		totalPages: number;
		nextPage: boolean;
		prevPage: boolean;
	};
}

export interface UpdateJournalResponse {
	message: string;
	data: JournalEntry;
}

export interface DeleteJournalResponse {
	message: string;
	data: JournalEntry;
}

export interface PostJournalResponse {
	message: string;
	data: JournalEntry;
}

export interface ReverseJournalResponse {
	message: string;
	data: JournalEntry;
}

export interface ValidateJournalResponse {
	isValid: boolean;
	errors?: string[];
	balanceSheetBalanced?: boolean;
	totalAssets?: number;
	totalLiabilities?: number;
	totalEquity?: number;
	totalRevenue?: number;
	totalExpenses?: number;
}

// Query Keys
export const journalKeys = {
	all: ["journal"] as const,
	lists: () => [...journalKeys.all, "list"] as const,
	list: (filters: ListJournalRequest) =>
		[...journalKeys.lists(), filters] as const,
	details: () => [...journalKeys.all, "detail"] as const,
	detail: (id: string) => [...journalKeys.details(), id] as const,
};

// API Functions
async function createJournal(
	data: CreateJournalRequest
): Promise<CreateJournalResponse> {
	const response = await api.post("/v1/accounting/journal", data);
	return response.data;
}

async function getJournal(id: string): Promise<GetJournalResponse> {
	const response = await api.get(`/v1/accounting/journal/${id}`);
	// API returns { message, data, success, status, timestamp, cache }
	return {
		message: response.data.message || "Journal entry fetched successfully",
		data: response.data.data,
	};
}

async function listJournal(
	params?: ListJournalRequest
): Promise<ListJournalResponse> {
	const response = await api.get("/v1/accounting/journal", { params });
	return response.data;
}

async function updateJournal(
	id: string,
	data: UpdateJournalRequest
): Promise<UpdateJournalResponse> {
	const response = await api.patch(`/v1/accounting/journal/${id}`, data);
	return response.data;
}

async function deleteJournal(id: string): Promise<DeleteJournalResponse> {
	const response = await api.delete(`/v1/accounting/journal/${id}`);
	return response.data;
}

async function postJournal(id: string): Promise<PostJournalResponse> {
	const response = await api.patch(`/v1/accounting/journal/${id}/post`);
	return response.data;
}

async function reverseJournal(id: string): Promise<ReverseJournalResponse> {
	const response = await api.patch(`/v1/accounting/journal/${id}/reverse`);
	return response.data;
}

async function validateJournal(
	data: ValidateJournalRequest
): Promise<ValidateJournalResponse> {
	const response = await api.post("/v1/accounting/journal/validate", data);
	return response.data;
}

// React Query Hooks
export function useJournalList(filters?: ListJournalRequest) {
	return useQuery({
		queryKey: journalKeys.list(filters || {}),
		queryFn: () => listJournal(filters),
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useJournal(id: string | null) {
	return useQuery({
		queryKey: journalKeys.detail(id || ""),
		queryFn: () => getJournal(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCreateJournal() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createJournal,
		onSuccess: () => {
			toast.success("Journal entry created successfully!");
			queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				const errorMessage =
					error.response?.data?.message || "Failed to create journal entry";
				toast.error(errorMessage);
			}
		},
	});
}

export function useUpdateJournal() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateJournalRequest }) =>
			updateJournal(id, data),
		onSuccess: (_, variables) => {
			toast.success("Journal entry updated successfully!");
			queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: journalKeys.detail(variables.id),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				const errorMessage =
					error.response?.data?.message || "Failed to update journal entry";
				toast.error(errorMessage);
			}
		},
	});
}

export function useDeleteJournal() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteJournal,
		onSuccess: () => {
			toast.success("Journal entry deleted successfully!");
			queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				const errorMessage =
					error.response?.data?.message || "Failed to delete journal entry";
				toast.error(errorMessage);
			}
		},
	});
}

export function usePostJournal() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: postJournal,
		onSuccess: (data, journalId) => {
			toast.success("Journal entry posted successfully!");
			queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: journalKeys.detail(journalId),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				const errorMessage =
					error.response?.data?.message || "Failed to post journal entry";
				toast.error(errorMessage);
			}
		},
	});
}

export function useReverseJournal() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: reverseJournal,
		onSuccess: (data, journalId) => {
			toast.success("Journal entry reversed successfully!");
			queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: journalKeys.detail(journalId),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				const errorMessage =
					error.response?.data?.message || "Failed to reverse journal entry";
				toast.error(errorMessage);
			}
		},
	});
}

export function useValidateJournal() {
	return useMutation({
		mutationFn: validateJournal,
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				const errorMessage =
					error.response?.data?.message || "Validation failed";
				toast.error(errorMessage);
			}
		},
	});
}
