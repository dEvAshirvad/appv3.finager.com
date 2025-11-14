"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { UseFormReturn } from "react-hook-form";
import { completeOnboarding } from "./auth";

// Types for organization data
export interface OrganizationMember {
	organizationId: string;
	userId: string;
	role: string;
	createdAt: string;
	id: string;
	user?: {
		id: string;
		email: string;
	};
}

export interface Organization {
	name: string;
	slug: string;
	createdAt: string;
	type: string;
	id: string;
	members?: OrganizationMember[];
	invitations?: unknown[];
	teams?: unknown | null;
}

export interface FullOrganization extends Organization {
	gstin: string;
	industry: string;
	members: OrganizationMember[];
	invitations: unknown[];
	teams: unknown | null;
}

// Types for organization requests
export interface CreateOrganizationRequest {
	name: string;
	slug: string;
	type: string;
	isGstRegistered: boolean;
	gstin: string;
	industry: string;
	form?: UseFormReturn<any>;
}

export interface SetActiveOrganizationRequest {
	organizationId: string;
}

export interface UpdateOrganizationRequest {
	data: {
		name?: string;
		type?: string;
		slug?: string;
	};
	organizationId: string;
	form?: UseFormReturn<any>;
}

export interface DeleteOrganizationRequest {
	organizationId: string;
}

export interface SetActiveOrganizationResponse {
	message: string;
	data: {
		_id: string;
		expiresAt: string;
		token: string;
		createdAt: string;
		updatedAt: string;
		ipAddress: string;
		userAgent: string;
		userId: string;
		activeOrganizationId: string;
		activeOrganizationRole: string;
	};
	success: boolean;
	status: number;
	timestamp: string;
	cache: boolean;
}

// Query keys
export const organizationKeys = {
	all: ["organization"] as const,
	lists: () => [...organizationKeys.all, "list"] as const,
	list: () => [...organizationKeys.lists(), "all"] as const,
	details: () => [...organizationKeys.all, "detail"] as const,
	detail: (id: string) => [...organizationKeys.details(), id] as const,
	full: () => [...organizationKeys.all, "full"] as const,
};

// API functions
async function createOrganization({
	form,
	...data
}: CreateOrganizationRequest) {
	const response = await api.post("/auth/organization/create", data);
	if (form) {
		form.reset();
	}
	return response.data;
}

async function setActiveOrganization(
	data: SetActiveOrganizationRequest
): Promise<SetActiveOrganizationResponse> {
	const response = await api.post("/v1/session/organization/set-active", {
		organizationId: data.organizationId,
	});
	return response.data;
}

async function getFullOrganization(): Promise<FullOrganization> {
	const response = await api.get("/auth/organization/get-full-organization");
	return response.data;
}

async function getOrganizationList(): Promise<Organization[]> {
	const response = await api.get("/auth/organization/list");
	return response.data;
}

async function updateOrganization(data: UpdateOrganizationRequest) {
	const response = await api.post("/auth/organization/update", {
		data: data.data,
		organizationId: data.organizationId,
	});
	if (data.form) {
		data.form.reset();
	}
	return response.data;
}

async function deleteOrganization(data: DeleteOrganizationRequest) {
	const response = await api.post("/auth/organization/delete", {
		organizationId: data.organizationId,
	});
	return response.data;
}

// React Query hooks
export function useCreateOrganization() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: createOrganization,
		onSuccess: async (data) => {
			toast.success("Organization created successfully!");
			queryClient.invalidateQueries({
				queryKey: organizationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: organizationKeys.full(),
			});
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to create organization"
				);
			}
		},
	});
}

export function useSetActiveOrganization() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: setActiveOrganization,
		onSuccess: () => {
			toast.success("Active organization updated successfully!");
			queryClient.invalidateQueries({
				queryKey: organizationKeys.full(),
			});
			// Invalidate session to refresh active org
			queryClient.invalidateQueries({
				queryKey: ["session"],
			});
			router.refresh();
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to set active organization"
				);
			}
		},
	});
}

export function useFullOrganization() {
	return useQuery({
		queryKey: organizationKeys.full(),
		queryFn: getFullOrganization,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
		refetchOnWindowFocus: false,
	});
}

export function useOrganizationList() {
	return useQuery({
		queryKey: organizationKeys.list(),
		queryFn: getOrganizationList,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
		refetchOnWindowFocus: false,
	});
}

export function useUpdateOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateOrganization,
		onSuccess: (data) => {
			toast.success("Organization updated successfully!");
			queryClient.invalidateQueries({
				queryKey: organizationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: organizationKeys.full(),
			});
			if (data.id) {
				queryClient.invalidateQueries({
					queryKey: organizationKeys.detail(data.id),
				});
			}
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update organization"
				);
			}
		},
	});
}

export function useDeleteOrganization() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: deleteOrganization,
		onSuccess: () => {
			toast.success("Organization deleted successfully!");
			queryClient.invalidateQueries({
				queryKey: organizationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: organizationKeys.full(),
			});
			// Invalidate session to refresh active org
			queryClient.invalidateQueries({
				queryKey: ["session"],
			});
			router.refresh();
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to delete organization"
				);
			}
		},
	});
}
