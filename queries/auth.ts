"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { UseFormReturn } from "react-hook-form";

// Types for session data
export interface Session {
	id: "string";
	expiresAt: null;
	token: "string";
	createdAt: null;
	updatedAt: null;
	ipAddress: "string";
	userAgent: "string";
	userId: "string";
	activeOrganizationId: "string";
}

export interface User {
	id: "string";
	name: "string";
	email: "string";
	isOnboarded: boolean;
	emailVerified: true;
	image: "string";
	createdAt: null;
	updatedAt: null;
}

export interface SessionResponse {
	session: Session | null;
	user: User | null;
	message?: string;
}

// Types for authentication requests
export interface SocialSignInRequest {
	callbackURL: string;
	newUserCallbackURL: string;
	errorCallbackURL: string;
	provider: "google" | "github" | "facebook";
}

export interface EmailSignUpRequest {
	name: string;
	email: string;
	password: string;
	callbackURL?: string;
	form: UseFormReturn<any>;
}

export interface EmailSignInRequest {
	email: string;
	password: string;
	callbackURL?: string;
	rememberMe?: boolean;
	form: UseFormReturn<any>;
}

export interface ForgotPasswordRequest {
	email: string;
	redirectTo: string;
}

export interface ResetPasswordRequest {
	newPassword: string;
	token: string;
}

export interface UpdateUserRequest {
	name: string;
	form?: UseFormReturn<any>;
}

export interface UpdateUserResponse {
	status: boolean;
}

export interface OnboardingCompleteResponse {
	message: string;
	user: {
		_id: string;
		email: string;
		emailVerified: boolean;
		createdAt: string;
		updatedAt: string;
		role: string;
		isOnboarded: boolean;
	};
	isModified: boolean;
	success: boolean;
	status: number;
	timestamp: string;
	cache: boolean;
}

// Query keys
export const sessionKeys = {
	all: ["session"] as const,
	session: () => [...sessionKeys.all, "current"] as const,
};

// Fetch function for session using axios
async function fetchSession(): Promise<SessionResponse> {
	const response = await api.get("/auth/get-session");
	return response.data;
}

// Authentication API functions
// async function socialSignIn(data: SocialSignInRequest) {
// 	const response = await api.post("/sign-in/social", data);
// 	return response.data;
// }

async function socialSignInGoogle() {
	const response = await api.post("/auth/sign-in/social", {
		provider: "google",
		callbackURL: `${process.env.NEXT_PUBLIC_FRONTEND}/dashboard`,
		newUserCallbackURL: `${process.env.NEXT_PUBLIC_FRONTEND}/onboarding`,
		errorCallbackURL: `${process.env.NEXT_PUBLIC_FRONTEND}/error`,
	});
	return response.data;
}

async function emailSignUp(data: EmailSignUpRequest) {
	const response = await api.post("/auth/sign-up/email", data);
	data.form.reset();
	return response.data;
}

async function emailSignIn({ form, ...data }: EmailSignInRequest) {
	const response = await api.post("/auth/sign-in/email", data);
	form.reset();
	return response.data;
}

async function signOut() {
	const response = await api.post("/auth/sign-out", {});
	return response.data;
}

async function forgotPassword(data: ForgotPasswordRequest) {
	const response = await api.post("/auth/forget-password", data);
	return response.data;
}

async function resetPassword(data: ResetPasswordRequest) {
	const response = await api.post("/auth/reset-password", data);
	return response.data;
}

async function updateUser(
	data: UpdateUserRequest
): Promise<UpdateUserResponse> {
	const response = await api.post("/auth/update-user", {
		name: data.name,
	});
	if (data.form) {
		data.form.reset();
	}
	return response.data;
}

export async function completeOnboarding(): Promise<OnboardingCompleteResponse> {
	const response = await api.post("/v1/onboarding/complete");
	return response.data;
}

// TanStack Query hook for session
export function useSession() {
	return useQuery({
		queryKey: sessionKeys.session(),
		queryFn: fetchSession,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
		retry: 1,
		refetchOnWindowFocus: false,
	});
}

// Alternative hook with different options
export function useSessionWithOptions(options?: {
	enabled?: boolean;
	staleTime?: number;
	refetchOnWindowFocus?: boolean;
}) {
	return useQuery({
		queryKey: sessionKeys.session(),
		queryFn: fetchSession,
		staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
		refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
		enabled: options?.enabled ?? true, // Enable query only if options.enabled is true
	});
}

// Hook for checking if user is authenticated
export function useIsAuthenticated() {
	const { data, isLoading, error } = useSession();

	return {
		isAuthenticated: !!data?.session,
		isLoading,
		error,
		user: data?.user,
		session: data?.session,
	};
}

// Authentication mutation hooks
export function useSocialSignInGoogle() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: socialSignInGoogle,
		onSuccess: (data) => {
			// Invalidate and refetch session after successful sign in
			toast("Signed in successfully!", {
				description: "Redirecting to google...",
			});
			setTimeout(() => {
				window.location.href = data.url;
			}, 2000);
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
		},
	});
}

export function useEmailSignUp() {
	const queryClient = useQueryClient();
	const router = useRouter();
	return useMutation({
		mutationFn: emailSignUp,
		onSuccess: () => {
			// Invalidate and refetch session after successful sign up
			toast("Account created successfully!", {
				description: "Please check your email to verify your account.",
			});
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
			router.push("/onboarding");
		},
		onError: (error: unknown) => {
			if (error instanceof Error) {
				toast.error(error.message);
			}
		},
	});
}

export function useEmailSignIn() {
	const queryClient = useQueryClient();
	const router = useRouter();
	return useMutation({
		mutationFn: emailSignIn,
		onSuccess: (data) => {
			console.log(data);
			// Invalidate and refetch session after successful sign in
			toast("Signed in successfully!", {
				description: "Redirecting to dashboard...",
			});
			setTimeout(() => {
				if (data.redirect) {
					router.push(data.url);
				} else {
					router.push("/dashboard");
				}
			}, 3000);
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data.message);
			}
		},
	});
}

export function useSignOut() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			// Invalidate and refetch session after successful sign out
			toast("Signed out successfully!");
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
		},
	});
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: forgotPassword,
	});
}

export function useResetPassword() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: resetPassword,
		onSuccess: () => {
			// Invalidate and refetch session after successful password reset
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
		},
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateUser,
		onSuccess: () => {
			toast.success("User profile updated successfully!");
			// Invalidate and refetch session to get updated user data
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to update user profile"
				);
			}
		},
	});
}

export function useCompleteOnboarding() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: completeOnboarding,
		onSuccess: (data, variables) => {
			toast.success("Onboarding completed successfully!");
			// Invalidate and refetch session to get updated user data with isOnboarded: true
			queryClient.invalidateQueries({ queryKey: sessionKeys.all });
		},
		onError: (error: unknown) => {
			if (error instanceof AxiosError) {
				toast.error(
					error.response?.data?.message || "Failed to complete onboarding"
				);
			}
		},
	});
}
