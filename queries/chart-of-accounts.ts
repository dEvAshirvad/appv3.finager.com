"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum AccountType {
	ASSET = "asset",
	LIABILITY = "liability",
	EQUITY = "equity",
	INCOME = "income",
	EXPENSE = "expense",
}

export enum AccountStatus {
	ACTIVE = "active",
	INACTIVE = "inactive",
}

// Types
export interface COA {
	_id: string;
	organizationId: string;
	name: string;
	slug?: string;
	description?: string;
	type: AccountType;
	code: string;
	parentCode?: string | null;
	status: AccountStatus;
	createdAt: string;
	updatedAt: string;
}

export interface COATreeNode extends COA {
	children?: COATreeNode[];
}

// Request Types
export interface CreateCOARequest {
	organizationId?: string;
	name: string;
	description?: string;
	type: AccountType;
	code: string;
	parentCode?: string | null;
}

export interface UpdateCOARequest {
	name?: string;
	description?: string;
	type?: AccountType;
	code?: string;
	parentCode?: string | null;
	status?: AccountStatus;
}

export interface CreateCOATemplateRequest {
	template: CreateCOARequest[];
}

export interface ListCOARequest {
	search?: string;
	page?: number;
	limit?: number;
	sort?: string;
	organizationId?: string;
}

export interface MoveCOARequest {
	newParentId: string | null;
}

export interface COAStatisticsRequest {
	organizationId?: string;
}

export interface AccountJournalEntriesRequest {
	accountId: string;
	status?: "draft" | "posted" | "reversed";
	page?: number;
	limit?: number;
	dateFrom?: string; // ISO 8601 format
	dateTo?: string; // ISO 8601 format
}

// Response Types
export interface CreateCOAResponse {
	message: string;
	data: COA;
}

export interface GetCOAResponse {
	message: string;
	data: COA;
}

export interface ListCOAResponse {
	message: string;
	data: {
		docs: COA[];
		totalDocs: number;
		limit: number;
		page: number;
		totalPages: number;
		nextPage: boolean;
		prevPage: boolean;
	};
}

export interface UpdateCOAResponse {
	message: string;
	data: COA;
}

export interface DeleteCOAResponse {
	message: string;
	data: COA;
}

export interface CreateCOATemplateResponse {
	message: string;
	data: COA[];
}

export interface GetCOATreeResponse {
	message: string;
	data: COATreeNode[];
}

export interface GetCOAListResponse {
	message: string;
	data: COA[];
}

export interface GetCOAPathResponse {
	message: string;
	data: COA[];
}

export interface GetCOALevelResponse {
	message: string;
	data: {
		level: number;
	};
}

export interface MoveCOAResponse {
	message: string;
	data: COA;
}

export interface COAStatisticsResponse {
	message: string;
	data: {
		total: number;
		rootCount: number;
		leafCount: number;
		maxDepth: number;
		averageDepth: number;
	};
}

// Journal Entry types for account transactions
export interface AccountJournalEntryTransaction {
	amount: number;
	type: "debit" | "credit";
	accountId: string | { _id: string; name: string; type: string; code: string };
	accountInfo?: {
		_id: string;
		name: string;
		code: string;
		type: string;
	};
	description?: string;
	_id: string;
}

export interface AccountJournalEntry {
	_id: string;
	organizationId: string | { _id: string; name: string };
	name: string;
	description?: string;
	date: string;
	reference?: string;
	transactions: AccountJournalEntryTransaction[];
	status: "draft" | "posted" | "reversed";
	createdBy: string;
	updatedBy: string;
	createdAt: string;
	updatedAt: string;
	__v?: number;
}

export interface AccountJournalEntriesResponse {
	message: string;
	data: {
		account: {
			_id: string;
			name: string;
			code: string;
			type: string;
		};
		descendantAccounts?: Array<{
			_id: string;
			name: string;
			code: string;
			type: string;
		}>;
		journalEntries: AccountJournalEntry[];
		totalDocs: number;
		limit: number;
		page: number;
		totalPages: number;
		nextPage: boolean;
		prevPage: boolean;
	};
}

// Query Keys
export const coaKeys = {
	all: ["coa"] as const,
	lists: () => [...coaKeys.all, "list"] as const,
	list: (filters: ListCOARequest) => [...coaKeys.lists(), filters] as const,
	details: () => [...coaKeys.all, "detail"] as const,
	detail: (id: string) => [...coaKeys.details(), id] as const,
	byCode: (code: string) => [...coaKeys.all, "code", code] as const,
	journalEntries: () => [...coaKeys.all, "journal-entries"] as const,
	accountJournalEntries: (params: AccountJournalEntriesRequest) =>
		[...coaKeys.journalEntries(), params] as const,
	tree: {
		all: (organizationId?: string) =>
			[...coaKeys.all, "tree", "all", organizationId] as const,
		roots: (organizationId?: string) =>
			[...coaKeys.all, "tree", "roots", organizationId] as const,
		leaves: (organizationId?: string) =>
			[...coaKeys.all, "tree", "leaves", organizationId] as const,
	},
	hierarchy: {
		ancestors: (id: string) =>
			[...coaKeys.all, "hierarchy", "ancestors", id] as const,
		descendants: (id: string, includeSelf?: boolean) =>
			[...coaKeys.all, "hierarchy", "descendants", id, includeSelf] as const,
		children: (id: string) =>
			[...coaKeys.all, "hierarchy", "children", id] as const,
		path: (id: string) => [...coaKeys.all, "hierarchy", "path", id] as const,
		level: (id: string) => [...coaKeys.all, "hierarchy", "level", id] as const,
	},
	statistics: (organizationId?: string) =>
		[...coaKeys.all, "statistics", organizationId] as const,
};

// API Functions
async function createCOA(data: CreateCOARequest): Promise<CreateCOAResponse> {
	const response = await api.post("/v1/accounting/coa", data);
	return response.data;
}

async function getCOA(id: string): Promise<GetCOAResponse> {
	const response = await api.get(`/v1/accounting/coa/${id}`);
	// API returns { message, data, success, status, timestamp, cache }
	// Extract just { message, data } to match GetCOAResponse
	return {
		message: response.data.message || "COA fetched successfully",
		data: response.data.data,
	};
}

async function getCOAByCode(code: string): Promise<GetCOAResponse> {
	const response = await api.get(`/v1/accounting/coa/code/${code}`);
	// API returns { message, data, success, status, timestamp, cache }
	return {
		message: response.data.message || "COA fetched successfully",
		data: response.data.data,
	};
}

async function listCOA(params?: ListCOARequest): Promise<ListCOAResponse> {
	const response = await api.get("/v1/accounting/coa", { params });
	return response.data;
}

async function updateCOA(
	id: string,
	data: UpdateCOARequest
): Promise<UpdateCOAResponse> {
	const response = await api.patch(`/v1/accounting/coa/${id}`, data);
	return response.data;
}

async function deleteCOA(id: string): Promise<DeleteCOAResponse> {
	const response = await api.delete(`/v1/accounting/coa/${id}`);
	return response.data;
}

async function createCOATemplate(
	data: CreateCOATemplateRequest
): Promise<CreateCOATemplateResponse> {
	const response = await api.post("/v1/accounting/coa/template", data);
	return response.data;
}

async function getCOATree(
	organizationId?: string
): Promise<GetCOATreeResponse> {
	const response = await api.get("/v1/accounting/coa/tree/all", {
		params: { organizationId },
	});
	return response.data;
}

async function getRootCOAs(
	organizationId?: string
): Promise<GetCOAListResponse> {
	const response = await api.get("/v1/accounting/coa/tree/roots", {
		params: { organizationId },
	});
	return response.data;
}

async function getLeafCOAs(
	organizationId?: string
): Promise<GetCOAListResponse> {
	const response = await api.get("/v1/accounting/coa/tree/leaves", {
		params: { organizationId },
	});
	return response.data;
}

async function getCOAAncestors(id: string): Promise<GetCOAListResponse> {
	const response = await api.get(`/v1/accounting/coa/${id}/ancestors`);
	return response.data;
}

async function getCOADescendants(
	id: string,
	includeSelf?: boolean
): Promise<GetCOAListResponse> {
	const response = await api.get(`/v1/accounting/coa/${id}/descendants`, {
		params: { includeSelf },
	});
	return response.data;
}

async function getCOAChildren(id: string): Promise<GetCOAListResponse> {
	const response = await api.get(`/v1/accounting/coa/${id}/children`);
	return response.data;
}

async function getCOAPath(id: string): Promise<GetCOAPathResponse> {
	const response = await api.get(`/v1/accounting/coa/${id}/path`);
	return response.data;
}

async function getCOALevel(id: string): Promise<GetCOALevelResponse> {
	const response = await api.get(`/v1/accounting/coa/${id}/level`);
	return response.data;
}

async function moveCOA(
	id: string,
	data: MoveCOARequest
): Promise<MoveCOAResponse> {
	const response = await api.patch(`/v1/accounting/coa/${id}/move`, data);
	return response.data;
}

async function getCOAStatistics(
	params?: COAStatisticsRequest
): Promise<COAStatisticsResponse> {
	const response = await api.get("/v1/accounting/coa/statistics/overview", {
		params,
	});
	return response.data;
}

async function getAccountJournalEntries(
	params: AccountJournalEntriesRequest
): Promise<AccountJournalEntriesResponse> {
	const response = await api.get(
		`/v1/accounting/coa/${params.accountId}/journal-entries`,
		{
			params: {
				status: params.status,
				page: params.page,
				limit: params.limit,
				dateFrom: params.dateFrom,
				dateTo: params.dateTo,
			},
		}
	);
	return response.data;
}

// React Query Hooks
export function useCOAList(filters?: ListCOARequest) {
	return useQuery({
		queryKey: coaKeys.list(filters || {}),
		queryFn: () => listCOA(filters),
		enabled: !!filters, // Only run query if filters are provided
		staleTime: 0, // Always refetch when query key changes (including search)
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: false, // Don't refetch on window focus
	});
}

export function useCOA(id: string | null) {
	return useQuery({
		queryKey: coaKeys.detail(id || ""),
		queryFn: () => getCOA(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCOAByCode(code: string | null) {
	return useQuery({
		queryKey: coaKeys.byCode(code || ""),
		queryFn: () => getCOAByCode(code!),
		enabled: !!code,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCreateCOA() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCOA,
		onSuccess: () => {
			toast.success("Account created successfully!");
			queryClient.invalidateQueries({ queryKey: coaKeys.lists() });
			queryClient.invalidateQueries({ queryKey: coaKeys.tree.all() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to create account"
				);
			}
		},
	});
}

export function useUpdateCOA() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateCOARequest }) =>
			updateCOA(id, data),
		onSuccess: (_, variables) => {
			toast.success("Account updated successfully!");
			queryClient.invalidateQueries({ queryKey: coaKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: coaKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: coaKeys.tree.all() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update account"
				);
			}
		},
	});
}

export function useDeleteCOA() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteCOA,
		onSuccess: () => {
			toast.success("Account deleted successfully!");
			queryClient.invalidateQueries({ queryKey: coaKeys.lists() });
			queryClient.invalidateQueries({ queryKey: coaKeys.tree.all() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to delete account"
				);
			}
		},
	});
}

export function useCreateCOATemplate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCOATemplate,
		onSuccess: (data) => {
			toast.success(
				`${data.data.length} accounts created successfully from template!`
			);
			queryClient.invalidateQueries({ queryKey: coaKeys.lists() });
			queryClient.invalidateQueries({ queryKey: coaKeys.tree.all() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message ||
						"Failed to create accounts from template"
				);
			}
		},
	});
}

export function useCOATree(organizationId?: string) {
	return useQuery({
		queryKey: coaKeys.tree.all(organizationId),
		queryFn: () => getCOATree(organizationId),
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useRootCOAs(organizationId?: string) {
	return useQuery({
		queryKey: coaKeys.tree.roots(organizationId),
		queryFn: () => getRootCOAs(organizationId),
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useLeafCOAs(organizationId?: string) {
	return useQuery({
		queryKey: coaKeys.tree.leaves(organizationId),
		queryFn: () => getLeafCOAs(organizationId),
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCOAAncestors(id: string | null) {
	return useQuery({
		queryKey: coaKeys.hierarchy.ancestors(id || ""),
		queryFn: () => getCOAAncestors(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCOADescendants(id: string | null, includeSelf?: boolean) {
	return useQuery({
		queryKey: coaKeys.hierarchy.descendants(id || "", includeSelf),
		queryFn: () => getCOADescendants(id!, includeSelf),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCOAChildren(id: string | null) {
	return useQuery({
		queryKey: coaKeys.hierarchy.children(id || ""),
		queryFn: () => getCOAChildren(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCOAPath(id: string | null) {
	return useQuery({
		queryKey: coaKeys.hierarchy.path(id || ""),
		queryFn: () => getCOAPath(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useCOALevel(id: string | null) {
	return useQuery({
		queryKey: coaKeys.hierarchy.level(id || ""),
		queryFn: () => getCOALevel(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useMoveCOA() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: MoveCOARequest }) =>
			moveCOA(id, data),
		onSuccess: (_, variables) => {
			toast.success("Account moved successfully!");
			queryClient.invalidateQueries({ queryKey: coaKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: coaKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: coaKeys.tree.all() });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || "Failed to move account");
			}
		},
	});
}

export function useCOAStatistics(organizationId?: string) {
	return useQuery({
		queryKey: coaKeys.statistics(organizationId),
		queryFn: () => getCOAStatistics({ organizationId }),
		staleTime: 5 * 60 * 1000, // 5 minutes (statistics don't change often)
		gcTime: 30 * 60 * 1000, // 30 minutes
	});
}

export function useAccountJournalEntries(params: AccountJournalEntriesRequest) {
	return useQuery({
		queryKey: coaKeys.accountJournalEntries(params),
		queryFn: () => getAccountJournalEntries(params),
		enabled: !!params.accountId,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}
