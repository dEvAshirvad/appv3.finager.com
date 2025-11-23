"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Enums
export enum ContactType {
	CUSTOMER = "CUSTOMER",
	VENDOR = "VENDOR",
	BOTH = "BOTH",
}

export enum ContactStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
}

// Types
export interface Address {
	street?: string;
	city?: string;
	state?: string;
	pincode?: string;
	country?: string;
}

export interface COAAccount {
	_id: string;
	name: string;
	code: string;
	type: string;
}

export interface Contact {
	_id?: string;
	id?: string;
	organizationId: string;
	type: ContactType;
	name: string;
	companyName?: string;
	gstin?: string;
	email?: string;
	phone?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
	openingBalance?: number;
	openingBalanceType?: "debit" | "credit";
	paymentTerms?: number;
	creditLimit?: number;
	arAccountId?: string | COAAccount;
	apAccountId?: string | COAAccount;
	status: ContactStatus;
	createdAt: string;
	updatedAt: string;
}

// Request Types
export interface CreateContactRequest {
	type: ContactType;
	name: string;
	companyName?: string;
	gstin?: string;
	email?: string;
	phone?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
	openingBalance?: number;
	openingBalanceType?: "debit" | "credit";
	paymentTerms?: number;
	creditLimit?: number;
	organizationId?: string;
}

export interface UpdateContactRequest {
	name?: string;
	companyName?: string;
	gstin?: string;
	email?: string;
	phone?: string;
	billingAddress?: Address;
	shippingAddress?: Address;
	openingBalance?: number;
	openingBalanceType?: "debit" | "credit";
	paymentTerms?: number;
	creditLimit?: number;
	type?: ContactType;
	status?: ContactStatus;
}

export interface ListContactsRequest {
	type?: ContactType;
	search?: string;
	status?: ContactStatus;
	page?: number;
	limit?: number;
	sort?: string;
	organizationId?: string;
}

// Response Types
export interface CreateContactResponse {
	message: string;
	data: Contact;
	success: boolean;
	status: number;
}

export interface GetContactResponse {
	message: string;
	data: Contact;
	success: boolean;
	status: number;
}

export interface ListContactsResponse {
	message: string;
	data: {
		docs: Contact[];
		totalDocs: number;
		limit: number;
		page: number;
		totalPages: number;
		nextPage: number | null;
		prevPage: number | null;
	};
	success: boolean;
	status: number;
}

export interface UpdateContactResponse {
	message: string;
	data: Contact;
	success: boolean;
	status: number;
}

export interface DeleteContactResponse {
	message: string;
	data: Contact;
	success: boolean;
	status: number;
}

export interface ImportContactsResponse {
	message: string;
	data: {
		total: number;
		successful: number;
		failed: number;
		errors: string[];
	};
	success: boolean;
	status: number;
}

export interface ExportContactsResponse {
	message: string;
	success: boolean;
	status: number;
}

// Query Keys
export const contactsKeys = {
	all: ["contacts"] as const,
	lists: () => [...contactsKeys.all, "list"] as const,
	list: (params: ListContactsRequest) =>
		[...contactsKeys.lists(), params] as const,
	details: () => [...contactsKeys.all, "detail"] as const,
	detail: (id: string) => [...contactsKeys.details(), id] as const,
};

// API Functions
async function createContact(
	params: CreateContactRequest
): Promise<CreateContactResponse> {
	const response = await api.post("/v1/contacts", params);
	return response.data;
}

async function getContact(id: string): Promise<GetContactResponse> {
	const response = await api.get(`/v1/contacts/${id}`);
	return response.data;
}

async function listContacts(
	params: ListContactsRequest
): Promise<ListContactsResponse> {
	const response = await api.get("/v1/contacts", { params });
	return response.data;
}

async function updateContact(
	id: string,
	params: UpdateContactRequest
): Promise<UpdateContactResponse> {
	const response = await api.patch(`/v1/contacts/${id}`, params);
	return response.data;
}

async function deleteContact(id: string): Promise<DeleteContactResponse> {
	const response = await api.delete(`/v1/contacts/${id}`);
	return response.data;
}

async function importContacts(file: File): Promise<ImportContactsResponse> {
	const formData = new FormData();
	formData.append("file", file);
	const response = await api.post("/v1/contacts/import/csv", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
	return response.data;
}

async function exportContacts(params?: {
	type?: ContactType;
	status?: ContactStatus;
}): Promise<ExportContactsResponse> {
	const response = await api.get("/v1/contacts/export/csv", { params });
	return response.data;
}

// React Query Hooks
export function useContactList(
	params?: ListContactsRequest,
	enabled?: boolean
) {
	return useQuery({
		queryKey: contactsKeys.list(params || {}),
		queryFn: () => listContacts(params || {}),
		enabled: enabled ?? true,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useContact(id?: string) {
	return useQuery({
		queryKey: contactsKeys.detail(id || ""),
		queryFn: () => getContact(id!),
		enabled: !!id,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useCreateContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createContact,
		onSuccess: (data) => {
			toast.success(data.message || "Contact created successfully");
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			const errorMessage =
				error.response?.data?.message || "Failed to create contact";
			toast.error(errorMessage);
		},
	});
}

export function useUpdateContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) =>
			updateContact(id, data),
		onSuccess: (data, variables) => {
			toast.success(data.message || "Contact updated successfully");
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: contactsKeys.detail(variables.id),
			});
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			const errorMessage =
				error.response?.data?.message || "Failed to update contact";
			toast.error(errorMessage);
		},
	});
}

export function useDeleteContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteContact,
		onSuccess: (data) => {
			toast.success(data.message || "Contact deleted successfully");
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			const errorMessage =
				error.response?.data?.message || "Failed to delete contact";
			toast.error(errorMessage);
		},
	});
}

export function useImportContacts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: importContacts,
		onSuccess: (data) => {
			if (data.status === 501) {
				toast.info("CSV import not yet implemented");
			} else {
				toast.success(
					`Imported ${data.data.successful} of ${data.data.total} contacts`
				);
				queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			}
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			const errorMessage =
				error.response?.data?.message || "Failed to import contacts";
			toast.error(errorMessage);
		},
	});
}

export function useExportContacts() {
	return useMutation({
		mutationFn: (params?: { type?: ContactType; status?: ContactStatus }) =>
			exportContacts(params),
		onSuccess: (data) => {
			if (data.status === 501) {
				toast.info("CSV export not yet implemented");
			} else {
				toast.success("Contacts exported successfully");
			}
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			const errorMessage =
				error.response?.data?.message || "Failed to export contacts";
			toast.error(errorMessage);
		},
	});
}
